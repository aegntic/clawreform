//! Orchestrator agent — receives goals, decomposes, delegates, and synthesizes.
//!
//! The orchestrator is the top-level agent. It receives goals, breaks them
//! into tasks for team leads, and synthesizes results.

use crate::context_bus::ContextBus;
use crate::error::{TeamError, TeamResult};
use crate::message_bus::MessageBus;
use crate::scoped_fs::ScopedFileSystem;
use crate::team_lead::TeamLead;
use crate::template::TemplateRegistry;
use crate::types::*;
use crate::AgentId;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, Semaphore};

/// The top-level orchestrator that manages the entire team.
///
/// Responsible for:
/// - Receiving high-level goals
/// - Decomposing goals into team lead tasks
/// - Delegating to team leads
/// - Synthesizing results
#[allow(dead_code)]
pub struct Orchestrator {
    identity: TeamAgentIdentity,
    mental_model: Arc<RwLock<MentalModel>>,
    health: Arc<RwLock<TeamAgentHealth>>,
    executor: SharedExecutor,
    context_bus: ContextBus,
    message_bus: MessageBus,
    templates: TemplateRegistry,
    fs: ScopedFileSystem,
    team_leads: Arc<RwLock<Vec<TeamLead>>>,
    max_concurrent_goals: u32,
    goal_semaphore: Arc<Semaphore>,
    started_at: std::time::Instant,
}

impl Orchestrator {
    /// Create a new orchestrator.
    pub fn new(
        name: &str,
        model: Option<String>,
        executor: SharedExecutor,
        context_bus: ContextBus,
        message_bus: MessageBus,
        fs: ScopedFileSystem,
        team_leads: Vec<TeamLead>,
    ) -> Self {
        let id = AgentId::new();

        // Set orchestrator as parent for all leads
        let leads = Arc::new(RwLock::new(team_leads));

        let identity = TeamAgentIdentity {
            id,
            name: name.to_string(),
            role: TeamRole::Orchestrator,
            expertise: vec!["coordination".into(), "decomposition".into(), "synthesis".into()],
            parent_id: None,
            model,
        };

        let health = TeamAgentHealth {
            agent_id: id,
            status: TeamAgentStatus::Idle,
            last_heartbeat: chrono::Utc::now(),
            ..Default::default()
        };

        let max_concurrent = 3;
        let semaphore = Arc::new(Semaphore::new(max_concurrent as usize));

        Self {
            identity,
            mental_model: Arc::new(RwLock::new(MentalModel {
                agent_id: id,
                ..Default::default()
            })),
            health: Arc::new(RwLock::new(health)),
            executor,
            context_bus,
            message_bus,
            templates: TemplateRegistry::with_builtins(),
            fs,
            team_leads: leads,
            max_concurrent_goals: max_concurrent,
            goal_semaphore: semaphore,
            started_at: std::time::Instant::now(),
        }
    }

    /// Get the orchestrator's identity.
    pub fn identity(&self) -> &TeamAgentIdentity {
        &self.identity
    }

    /// Get the orchestrator's agent ID.
    pub fn id(&self) -> AgentId {
        self.identity.id
    }

    /// Get current health.
    pub async fn health(&self) -> TeamAgentHealth {
        self.health.read().await.clone()
    }

    /// Set max concurrent goals.
    pub fn set_max_concurrent_goals(&mut self, max: u32) {
        self.max_concurrent_goals = max;
        self.goal_semaphore = Arc::new(Semaphore::new(max as usize));
    }

    /// Process a high-level goal end-to-end.
    ///
    /// 1. Decompose the goal into sub-tasks
    /// 2. Assign sub-tasks to team leads
    /// 3. Collect results
    /// 4. Synthesize into a final result
    pub async fn process_goal(&self, goal: &str) -> TeamResult<GoalResult> {
        let start = std::time::Instant::now();

        // Acquire semaphore permit (concurrency limit)
        let _permit = self.goal_semaphore.acquire().await.map_err(|_| {
            TeamError::NotRunning
        })?;

        // Update status
        {
            let mut health = self.health.write().await;
            health.status = TeamAgentStatus::Working;
            health.last_heartbeat = chrono::Utc::now();
        }

        tracing::info!(orchestrator = %self.identity.name, "Processing goal: {}", goal);

        // Step 1: Decompose
        let sub_tasks = self.decompose_goal(goal).await?;

        // Step 2: Execute sub-tasks via team leads
        let mut task_results = Vec::new();
        for sub_task in &sub_tasks {
            let result = self.delegate_to_lead(sub_task).await;
            match result {
                Ok(r) => task_results.push(r),
                Err(e) => {
                    tracing::warn!(
                        orchestrator = %self.identity.name,
                        "Sub-task failed: {}",
                        e
                    );
                    task_results.push(TaskResult {
                        task_id: sub_task.id,
                        agent_id: self.identity.id,
                        success: false,
                        result: e.to_string(),
                        artifacts: Vec::new(),
                        iterations_used: 0,
                        tokens_used: 0,
                        duration_ms: 0,
                    });
                }
            }
        }

        // Step 3: Synthesize results
        let summary = self.synthesize_results(goal, &task_results).await?;

        let elapsed = start.elapsed();
        let all_artifacts: Vec<String> = task_results
            .iter()
            .flat_map(|r| r.artifacts.clone())
            .collect();

        let all_tokens: u64 = task_results.iter().map(|r| r.tokens_used).sum();
        let success = task_results.iter().all(|r| r.success);

        // Update health
        {
            let mut health = self.health.write().await;
            health.status = TeamAgentStatus::Done;
            health.tasks_completed += task_results.len() as u64;
            health.last_heartbeat = chrono::Utc::now();
        }

        Ok(GoalResult {
            goal: goal.to_string(),
            success,
            results: task_results,
            summary,
            total_tokens: all_tokens,
            total_duration_ms: elapsed.as_millis() as u64,
            artifacts: all_artifacts,
        })
    }

    /// Decompose a goal into sub-tasks for team leads.
    async fn decompose_goal(&self, goal: &str) -> TeamResult<Vec<TeamTask>> {
        let leads = self.team_leads.read().await;

        // Build lead descriptions
        let lead_descs: Vec<String> = leads
            .iter()
            .map(|l| {
                format!(
                    "- {} (domain: {}, expertise: {})",
                    l.identity().name,
                    l.domain(),
                    l.identity().expertise.join(", ")
                )
            })
            .collect();

        drop(leads);

        let mut template_vars = HashMap::new();
        template_vars.insert("name".to_string(), self.identity.name.clone());
        template_vars.insert("goal".to_string(), goal.to_string());
        template_vars.insert("team_leads".to_string(), lead_descs.join("\n"));

        let prompt = self
            .templates
            .render("orchestrator-decompose", &template_vars)?;

        let response = self.executor.execute(prompt, HashMap::new()).await?;

        // Parse the response into tasks
        // The LLM should return a JSON array of task objects
        let leads = self.team_leads.read().await;
        let tasks: Vec<TeamTask> = Self::parse_decomposed_tasks_sync(&leads, &response);
        drop(leads);

        if tasks.is_empty() {
            // Fallback: create one task per lead
            let leads = self.team_leads.read().await;
            return Ok(leads
                .iter()
                .map(|lead| {
                    let mut task = TeamTask::new(goal);
                    task.assignee_id = Some(lead.id());
                    task.assignee_role = Some(TeamRole::TeamLead);
                    task.description = format!(
                        "Handle the '{}' aspect of: {}",
                        lead.domain(),
                        goal
                    );
                    task
                })
                .collect());
        }

        Ok(tasks)
    }

    /// Parse LLM decomposed task response.
    ///
    /// Note: This is a synchronous helper. The caller must ensure
    /// the team_leads lock is not held when calling.
    fn parse_decomposed_tasks_sync(
        leads: &[TeamLead],
        response: &str,
    ) -> Vec<TeamTask> {
        // Try to parse as JSON array first
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(response) {
            if let Some(arr) = parsed.as_array() {
                return arr
                    .iter()
                    .filter_map(|item| {
                        let goal_str = item.get("goal")?.as_str()?.to_string();
                        let description = item
                            .get("description")
                            .and_then(|d| d.as_str())
                            .unwrap_or("")
                            .to_string();
                        let lead_name = item
                            .get("assignee")
                            .and_then(|a| a.as_str())
                            .unwrap_or("");

                        let assignee = leads
                            .iter()
                            .find(|l| l.identity().name == lead_name)
                            .map(|l| l.id());

                        let mut task = TeamTask::new(&goal_str);
                        task.description = description;
                        task.assignee_id = assignee;
                        task.assignee_role = assignee.map(|_| TeamRole::TeamLead);
                        task.parent_task_id = None;

                        Some(task)
                    })
                    .collect();
            }
        }

        Vec::new()
    }

    /// Delegate a sub-task to a team lead.
    async fn delegate_to_lead(&self, task: &TeamTask) -> TeamResult<TaskResult> {
        let leads = self.team_leads.read().await;

        let lead = if let Some(assignee_id) = task.assignee_id {
            leads.iter().find(|l| l.id() == assignee_id)
        } else {
            // Find first available (idle) lead
            let mut found: Option<&TeamLead> = None;
            for l in leads.iter() {
                let h = l.health().await;
                if h.status == TeamAgentStatus::Idle {
                    found = Some(l);
                    break;
                }
            }
            found.or_else(|| leads.first())
        };

        let lead = lead.ok_or_else(|| TeamError::Delegation {
            from_id: self.identity.id,
            to_id: task.assignee_id.unwrap_or_else(AgentId::new),
            reason: "No available team lead".into(),
        })?;

        // Send delegation message
        let msg = DelegationMessage::new(MessageType::TaskAssign, self.identity.id, lead.id())
            .with_task(task.id)
            .with_direction(MessageDirection::Down);
        let _ = self.message_bus.send(msg);

        lead.process_task(task).await
    }

    /// Synthesize results from all team leads.
    async fn synthesize_results(
        &self,
        goal: &str,
        results: &[TaskResult],
    ) -> TeamResult<String> {
        let results_text: Vec<String> = results
            .iter()
            .map(|r| {
                format!(
                    "### Task by agent {}\n**Success:** {}\n**Result:** {}",
                    r.agent_id,
                    r.success,
                    r.result.chars().take(500).collect::<String>()
                )
            })
            .collect();

        let mut template_vars = HashMap::new();
        template_vars.insert("name".to_string(), self.identity.name.clone());
        template_vars.insert("goal".to_string(), goal.to_string());
        template_vars.insert("results".to_string(), results_text.join("\n\n"));

        let prompt = self
            .templates
            .render("orchestrator-synthesize", &template_vars)?;

        self.executor.execute(prompt, HashMap::new()).await
    }

    /// Get health for the entire team.
    pub async fn team_health(&self) -> TeamHealth {
        let leads = self.team_leads.read().await;
        let mut agents = Vec::new();

        // Orchestrator health
        agents.push(self.health.read().await.clone());

        // Team lead healths
        for lead in leads.iter() {
            agents.push(lead.health().await);
        }

        let total_tasks = agents.iter().map(|a| a.tasks_completed + a.tasks_failed).sum();
        let completed = agents.iter().map(|a| a.tasks_completed).sum();
        let failed = agents.iter().map(|a| a.tasks_failed).sum();
        let pending = agents.iter().map(|a| a.tasks_in_progress).sum();
        let total_tokens = agents.iter().map(|a| a.tokens_used).sum();

        TeamHealth {
            team_name: self.identity.name.clone(),
            timestamp: chrono::Utc::now(),
            agents,
            total_tasks,
            completed_tasks: completed,
            failed_tasks: failed,
            pending_tasks: pending,
            total_tokens,
        }
    }

    /// Get the mental model.
    pub async fn mental_model(&self) -> MentalModel {
        self.mental_model.read().await.clone()
    }

    /// Get a reference to the context bus.
    pub fn context_bus(&self) -> &ContextBus {
        &self.context_bus
    }

    /// Get a reference to the message bus.
    pub fn message_bus(&self) -> &MessageBus {
        &self.message_bus
    }

    /// Get the number of team leads.
    pub async fn team_lead_count(&self) -> usize {
        self.team_leads.read().await.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_executor() -> SharedExecutor {
        SharedExecutor::new(Box::new(|prompt, _| {
            Box::pin(async move {
                let result = if prompt.contains("decompose") || prompt.contains("Decompose") {
                    // Return a JSON array for decomposition
                    r#"[{"goal": "Build the API", "description": "Create REST endpoints", "assignee": "CodeLead"}]"#.to_string()
                } else if prompt.contains("synthesize") || prompt.contains("Synthesize") {
                    "## Summary\nAll tasks completed successfully.".to_string()
                } else if prompt.contains("delegate") || prompt.contains("Delegate") {
                    "Delegating to worker...".to_string()
                } else {
                    format!("OK: {}", prompt.chars().take(50).collect::<String>())
                };
                Ok(result)
            })
        }))
    }

    fn make_test_team() -> (SharedExecutor, ContextBus, MessageBus, ScopedFileSystem) {
        let executor = make_test_executor();
        let bus = ContextBus::new();
        let msg_bus = MessageBus::new();
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());
        (executor, bus, msg_bus, fs)
    }

    #[tokio::test]
    async fn test_orchestrator_creation() {
        let (executor, bus, msg_bus, fs) = make_test_team();

        let leads = vec![TeamLead::new(
            "CodeLead",
            "software",
            vec!["rust".into()],
            None,
            executor.clone(),
            bus.clone(),
            msg_bus.clone(),
            fs.clone(),
            3,
        )];

        let orch = Orchestrator::new(
            "Orch",
            None,
            executor,
            bus,
            msg_bus,
            fs,
            leads,
        );

        assert_eq!(orch.identity().role, TeamRole::Orchestrator);
        assert_eq!(orch.team_lead_count().await, 1);
    }

    #[tokio::test]
    async fn test_process_goal() {
        let (executor, bus, msg_bus, fs) = make_test_team();

        let lead = TeamLead::new(
            "CodeLead",
            "software",
            vec!["rust".into()],
            None,
            executor.clone(),
            bus.clone(),
            msg_bus.clone(),
            fs.clone(),
            3,
        );

        let orch = Orchestrator::new(
            "Orch",
            None,
            executor,
            bus,
            msg_bus,
            fs,
            vec![lead],
        );

        let result = orch.process_goal("Build a REST API").await.unwrap();
        assert!(result.results.len() >= 1);
        assert!(result.summary.contains("Summary"));
    }

    #[tokio::test]
    async fn test_team_health() {
        let (executor, bus, msg_bus, fs) = make_test_team();

        let orch = Orchestrator::new(
            "Orch",
            None,
            executor,
            bus,
            msg_bus,
            fs,
            vec![],
        );

        let health = orch.team_health().await;
        assert_eq!(health.agents.len(), 1); // just the orchestrator
        assert_eq!(health.total_tasks, 0);
    }

    #[tokio::test]
    async fn test_parse_decomposed_tasks() {
        let (executor, bus, msg_bus, fs) = make_test_team();

        let lead = TeamLead::new(
            "CodeLead",
            "software",
            vec![],
            None,
            executor.clone(),
            bus.clone(),
            msg_bus.clone(),
            fs.clone(),
            3,
        );

        let orch = Orchestrator::new(
            "Orch",
            None,
            executor,
            bus,
            msg_bus,
            fs,
            vec![lead],
        );

        let response = r#"[
            {"goal": "Build API", "description": "Create endpoints", "assignee": "CodeLead"},
            {"goal": "Write tests", "description": "Unit tests", "assignee": "CodeLead"}
        ]"#;

        let leads = orch.team_leads.read().await;
        let tasks = Orchestrator::parse_decomposed_tasks_sync(&leads, response);
        assert_eq!(tasks.len(), 2);
        assert_eq!(tasks[0].goal, "Build API");
    }
}
