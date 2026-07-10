//! Team Lead agent — manages workers, delegates tasks, reviews output quality.
//!
//! Team leads sit between the orchestrator and workers. They receive goals,
//! break them into worker-level tasks, and review results before passing
//! them back up.

use crate::context_bus::ContextBus;
use crate::error::{TeamError, TeamResult};
use crate::message_bus::MessageBus;
use crate::scoped_fs::ScopedFileSystem;
use crate::template::TemplateRegistry;
use crate::types::*;
use crate::AgentId;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// A team lead that manages workers within a domain.
#[allow(dead_code)]
pub struct TeamLead {
    identity: TeamAgentIdentity,
    domain: String,
    mental_model: Arc<RwLock<MentalModel>>,
    health: Arc<RwLock<TeamAgentHealth>>,
    executor: SharedExecutor,
    context_bus: ContextBus,
    message_bus: MessageBus,
    templates: TemplateRegistry,
    fs: ScopedFileSystem,
    workers: Arc<RwLock<Vec<crate::worker::Worker>>>,
    max_concurrent_tasks: u32,
    active_tasks: Arc<RwLock<HashMap<TaskId, TaskStatus>>>,
    started_at: std::time::Instant,
}

impl TeamLead {
    /// Create a new team lead.
    pub fn new(
        name: &str,
        domain: &str,
        expertise: Vec<String>,
        model: Option<String>,
        executor: SharedExecutor,
        context_bus: ContextBus,
        message_bus: MessageBus,
        fs: ScopedFileSystem,
        max_concurrent_tasks: u32,
    ) -> Self {
        let id = AgentId::new();
        let identity = TeamAgentIdentity {
            id,
            name: name.to_string(),
            role: TeamRole::TeamLead,
            expertise,
            parent_id: None,
            model,
        };

        let health = TeamAgentHealth {
            agent_id: id,
            status: TeamAgentStatus::Idle,
            last_heartbeat: chrono::Utc::now(),
            ..Default::default()
        };

        Self {
            identity,
            domain: domain.to_string(),
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
            workers: Arc::new(RwLock::new(Vec::new())),
            max_concurrent_tasks,
            active_tasks: Arc::new(RwLock::new(HashMap::new())),
            started_at: std::time::Instant::now(),
        }
    }

    /// Get the team lead's identity.
    pub fn identity(&self) -> &TeamAgentIdentity {
        &self.identity
    }

    /// Get the team lead's agent ID.
    pub fn id(&self) -> AgentId {
        self.identity.id
    }

    /// Get the domain specialty.
    pub fn domain(&self) -> &str {
        &self.domain
    }

    /// Set the parent (orchestrator) agent ID.
    pub fn set_parent(&mut self, parent_id: AgentId) {
        self.identity.parent_id = Some(parent_id);
    }

    /// Get current health.
    pub async fn health(&self) -> TeamAgentHealth {
        self.health.read().await.clone()
    }

    /// Add a worker to this team lead.
    pub async fn add_worker(&self, mut worker: crate::worker::Worker) {
        worker.set_parent(self.identity.id);
        self.workers.write().await.push(worker);
    }

    /// Get number of workers.
    pub async fn worker_count(&self) -> usize {
        self.workers.read().await.len()
    }

    /// Get available (idle) workers.
    pub async fn available_workers(&self) -> Vec<AgentId> {
        let workers = self.workers.read().await;
        let mut idle = Vec::new();
        for w in workers.iter() {
            let health = w.health().await;
            if health.status == TeamAgentStatus::Idle {
                idle.push(w.id());
            }
        }
        idle
    }

    /// Process a task delegated from the orchestrator.
    ///
    /// 1. Analyzes the task
    /// 2. Delegates to available workers (or handles directly)
    /// 3. Reviews worker results
    /// 4. Returns synthesized result
    pub async fn process_task(&self, task: &TeamTask) -> TeamResult<TaskResult> {
        let start = std::time::Instant::now();

        // Update status
        {
            let mut health = self.health.write().await;
            health.status = TeamAgentStatus::Working;
            health.tasks_in_progress += 1;
            health.last_heartbeat = chrono::Utc::now();
        }

        // Track this task
        {
            let mut active = self.active_tasks.write().await;
            active.insert(task.id, TaskStatus::InProgress);
        }

        // Build worker descriptions for the prompt
        let workers = self.workers.read().await;
        let worker_descs: Vec<String> = workers
            .iter()
            .map(|w| {
                format!(
                    "- {} (expertise: {})",
                    w.identity().name,
                    w.identity().expertise.join(", ")
                )
            })
            .collect();
        drop(workers);

        // Build context
        let mut context: HashMap<String, serde_json::Value> = HashMap::new();
        for entry in self.context_bus.find_for_agent(&self.identity.id) {
            context.insert(entry.key, entry.value);
        }

        // Delegate via prompt
        let mut template_vars = HashMap::new();
        template_vars.insert("name".to_string(), self.identity.name.clone());
        template_vars.insert("domain".to_string(), self.domain.clone());
        template_vars.insert(
            "task".to_string(),
            format!("{}\n{}", task.goal, task.description),
        );
        template_vars.insert(
            "context".to_string(),
            serde_json::to_string_pretty(&context).unwrap_or_default(),
        );
        template_vars.insert(
            "workers".to_string(),
            worker_descs.join("\n"),
        );

        let prompt = self
            .templates
            .render("team-lead-delegate", &template_vars)
            .unwrap_or_else(|_| {
                format!(
                    "You are {}, a Team Lead in {}.\n\n## Task\n{}\n\n## Workers\n{}",
                    self.identity.name,
                    self.domain,
                    task.goal,
                    worker_descs.join("\n")
                )
            });

        // Execute delegation
        let result = self.executor.execute(prompt, context).await;
        let elapsed = start.elapsed();

        // Update task tracking
        {
            let mut active = self.active_tasks.write().await;
            match &result {
                Ok(_) => {
                    active.insert(task.id, TaskStatus::Done);
                }
                Err(_) => {
                    active.insert(task.id, TaskStatus::Failed);
                }
            }
        }

        match result {
            Ok(output) => {
                let mut health = self.health.write().await;
                health.status = TeamAgentStatus::Idle;
                health.tasks_completed += 1;
                health.tasks_in_progress -= 1;
                health.last_heartbeat = chrono::Utc::now();

                Ok(TaskResult {
                    task_id: task.id,
                    agent_id: self.identity.id,
                    success: true,
                    result: output,
                    artifacts: Vec::new(),
                    iterations_used: 1,
                    tokens_used: 0,
                    duration_ms: elapsed.as_millis() as u64,
                })
            }
            Err(e) => {
                let mut health = self.health.write().await;
                health.status = TeamAgentStatus::Error;
                health.tasks_failed += 1;
                health.tasks_in_progress -= 1;
                health.error_count += 1;
                health.last_error = Some(e.to_string());

                Err(e)
            }
        }
    }

    /// Review a worker's output for quality.
    pub async fn review_output(
        &self,
        task: &TeamTask,
        worker_output: &str,
    ) -> TeamResult<(bool, String)> {
        let mut template_vars = HashMap::new();
        template_vars.insert("name".to_string(), self.identity.name.clone());
        template_vars.insert("domain".to_string(), self.domain.clone());
        template_vars.insert(
            "task".to_string(),
            format!("{}\n{}", task.goal, task.description),
        );
        template_vars.insert("output".to_string(), worker_output.to_string());

        let prompt = self
            .templates
            .render("team-lead-review", &template_vars)?;

        let review = self.executor.execute(prompt, HashMap::new()).await?;

        // Parse the review — look for "approved" field
        let approved = review.contains("\"approved\": true")
            || review.contains("approved: true")
            || review.to_lowercase().contains("approved");

        Ok((approved, review))
    }

    /// Get the mental model.
    pub async fn mental_model(&self) -> MentalModel {
        self.mental_model.read().await.clone()
    }

    /// Get active task count.
    pub async fn active_task_count(&self) -> usize {
        self.active_tasks.read().await.len()
    }
}

// ============================================================================
// TeamManager — High-level API
// ============================================================================

/// High-level API for configuring, building, and running an agent team.
///
/// Provides a builder-style interface for team construction.
pub struct TeamManager {
    config: TeamConfig,
    executor: Option<SharedExecutor>,
    context_bus: Option<ContextBus>,
    message_bus: Option<MessageBus>,
    fs: Option<ScopedFileSystem>,
}

impl TeamManager {
    /// Create a new TeamManager from a config.
    pub fn new(config: TeamConfig) -> Self {
        Self {
            config,
            executor: None,
            context_bus: None,
            message_bus: None,
            fs: None,
        }
    }

    /// Load a TeamManager from a config file.
    pub fn from_file(path: &std::path::Path) -> TeamResult<Self> {
        let config = TeamConfig::load_from_file(&path.to_path_buf())?;
        config.validate()?;
        Ok(Self::new(config))
    }

    /// Set the LLM executor.
    pub fn with_executor(mut self, executor: SharedExecutor) -> Self {
        self.executor = Some(executor);
        self
    }

    /// Set the context bus.
    pub fn with_context_bus(mut self, bus: ContextBus) -> Self {
        self.context_bus = Some(bus);
        self
    }

    /// Set the message bus.
    pub fn with_message_bus(mut self, bus: MessageBus) -> Self {
        self.message_bus = Some(bus);
        self
    }

    /// Set the file system scope.
    pub fn with_file_system(mut self, fs: ScopedFileSystem) -> Self {
        self.fs = Some(fs);
        self
    }

    /// Build the team and return the orchestrator ready to use.
    pub async fn build(self) -> TeamResult<crate::orchestrator::Orchestrator> {
        let executor = self.executor.ok_or_else(|| {
            TeamError::Config("LLM executor is required. Call with_executor() first.".into())
        })?;

        let context_bus = self.context_bus.unwrap_or_default();
        let message_bus = self.message_bus.unwrap_or_default();
        let fs = self.fs.unwrap_or_else(|| {
            ScopedFileSystem::with_base(std::env::current_dir().unwrap_or_default())
        });

        // Seed context from config
        for (key, value) in &self.config.context {
            let entry = crate::types::ContextEntry::new(
                key,
                value.clone(),
                AgentId::new(), // system agent
            );
            context_bus.set(entry);
        }

        // Build team leads with workers
        let mut leads = Vec::new();
        for lead_config in &self.config.team_leads {
            let lead = TeamLead::new(
                &lead_config.name,
                &lead_config.domain,
                lead_config.expertise.clone(),
                lead_config.model.clone(),
                executor.clone(),
                context_bus.clone(),
                message_bus.clone(),
                fs.clone(),
                lead_config.max_concurrent_tasks,
            );

            for worker_config in &lead_config.workers {
                let worker = crate::worker::Worker::new(
                    &worker_config.name,
                    worker_config.expertise.clone(),
                    worker_config.model.clone(),
                    executor.clone(),
                    context_bus.clone(),
                    message_bus.clone(),
                    fs.clone(),
                );
                lead.add_worker(worker).await;
            }

            leads.push(lead);
        }

        // Build orchestrator
        let mut orchestrator = crate::orchestrator::Orchestrator::new(
            &self.config.orchestrator.name,
            self.config.orchestrator.model.clone(),
            executor,
            context_bus,
            message_bus,
            fs,
            leads,
        );

        orchestrator.set_max_concurrent_goals(self.config.orchestrator.max_concurrent_goals);

        Ok(orchestrator)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_executor() -> SharedExecutor {
        SharedExecutor::new(Box::new(|prompt, _| {
            Box::pin(async move { Ok(format!("LEAD: {}", prompt.chars().take(50).collect::<String>())) })
        }))
    }

    #[tokio::test]
    async fn test_team_lead_creation() {
        let executor = make_test_executor();
        let bus = ContextBus::new();
        let msg_bus = MessageBus::new();
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        let lead = TeamLead::new(
            "CodeLead",
            "software",
            vec!["rust".into(), "typescript".into()],
            None,
            executor,
            bus,
            msg_bus,
            fs,
            3,
        );

        assert_eq!(lead.identity().role, TeamRole::TeamLead);
        assert_eq!(lead.domain(), "software");
    }

    #[tokio::test]
    async fn test_add_workers() {
        let executor = make_test_executor();
        let bus = ContextBus::new();
        let msg_bus = MessageBus::new();
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        let lead = TeamLead::new(
            "Lead",
            "test",
            vec![],
            None,
            executor,
            bus,
            msg_bus,
            fs,
            2,
        );

        assert_eq!(lead.worker_count().await, 0);

        let executor2 = make_test_executor();
        let bus2 = ContextBus::new();
        let msg_bus2 = MessageBus::new();
        let dir2 = tempfile::tempdir().unwrap();
        let fs2 = ScopedFileSystem::with_base(dir2.path().to_path_buf());

        let w1 = crate::worker::Worker::new(
            "W1", vec!["x".into()], None, executor2, bus2, msg_bus2, fs2,
        );
        lead.add_worker(w1).await;

        assert_eq!(lead.worker_count().await, 1);
    }

    #[tokio::test]
    async fn test_process_task() {
        let executor = make_test_executor();
        let bus = ContextBus::new();
        let msg_bus = MessageBus::new();
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        let lead = TeamLead::new(
            "Lead",
            "test",
            vec![],
            None,
            executor,
            bus,
            msg_bus,
            fs,
            3,
        );

        let task = TeamTask::new("Build a feature");
        let result = lead.process_task(&task).await.unwrap();
        assert!(result.success);
    }

    #[tokio::test]
    async fn test_review_output() {
        let executor = SharedExecutor::new(Box::new(|_prompt, _| {
            Box::pin(async move {
                Ok(r#"quality_score: 8
approved: true
feedback: Good work
revision_needed: false"#.to_string())
            })
        }));

        let bus = ContextBus::new();
        let msg_bus = MessageBus::new();
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        let lead = TeamLead::new(
            "Reviewer",
            "code",
            vec![],
            None,
            executor,
            bus,
            msg_bus,
            fs,
            3,
        );

        let task = TeamTask::new("Write tests");
        let (approved, review) = lead.review_output(&task, "fn test() {}").await.unwrap();
        assert!(approved);
        assert!(review.contains("Good work"));
    }
}
