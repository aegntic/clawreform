//! Worker agent — executes specific tasks within domain scope.
//!
//! Workers are the leaf nodes of the team hierarchy. They receive tasks
//! from team leads, execute them, and return results.

use crate::context_bus::ContextBus;
use crate::error::TeamResult;
use crate::message_bus::MessageBus;
use crate::scoped_fs::ScopedFileSystem;
use crate::template::TemplateRegistry;
use crate::types::{
    DelegationMessage, MentalModel, SharedExecutor, TeamAgentHealth,
    TeamAgentIdentity, TeamAgentStatus, TeamRole, TeamTask, TaskResult,
};
use crate::AgentId;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// A worker agent that executes tasks.
#[allow(dead_code)]
pub struct Worker {
    identity: TeamAgentIdentity,
    mental_model: Arc<RwLock<MentalModel>>,
    health: Arc<RwLock<TeamAgentHealth>>,
    executor: SharedExecutor,
    context_bus: ContextBus,
    message_bus: MessageBus,
    templates: TemplateRegistry,
    fs: ScopedFileSystem,
    started_at: std::time::Instant,
    message_rx: Option<tokio::sync::mpsc::UnboundedReceiver<DelegationMessage>>,
}

impl Worker {
    /// Create a new worker agent.
    pub fn new(
        name: &str,
        expertise: Vec<String>,
        model: Option<String>,
        executor: SharedExecutor,
        context_bus: ContextBus,
        message_bus: MessageBus,
        fs: ScopedFileSystem,
    ) -> Self {
        let id = AgentId::new();
        let identity = TeamAgentIdentity {
            id,
            name: name.to_string(),
            role: TeamRole::Worker,
            expertise,
            parent_id: None,
            model,
        };

        let now = chrono::Utc::now();
        let health = TeamAgentHealth {
            agent_id: id,
            status: TeamAgentStatus::Idle,
            last_heartbeat: now,
            ..Default::default()
        };

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
            started_at: std::time::Instant::now(),
            message_rx: None,
        }
    }

    /// Get the worker's identity.
    pub fn identity(&self) -> &TeamAgentIdentity {
        &self.identity
    }

    /// Get the worker's agent ID.
    pub fn id(&self) -> AgentId {
        self.identity.id
    }

    /// Set the parent (team lead) agent ID.
    pub fn set_parent(&mut self, parent_id: AgentId) {
        self.identity.parent_id = Some(parent_id);
    }

    /// Get the current health status.
    pub async fn health(&self) -> TeamAgentHealth {
        self.health.read().await.clone()
    }

    /// Register with the message bus and start listening.
    pub fn register(&mut self) {
        let rx = self.message_bus.register(self.identity.id);
        self.message_rx = Some(rx);
    }

    /// Execute a task.
    pub async fn execute_task(&self, task: &TeamTask) -> TeamResult<TaskResult> {
        let start = std::time::Instant::now();

        // Update status
        {
            let mut health = self.health.write().await;
            health.status = TeamAgentStatus::Working;
            health.tasks_in_progress = 1;
            health.last_heartbeat = chrono::Utc::now();
        }

        // Build context from the context bus
        let mut context: HashMap<String, serde_json::Value> = HashMap::new();
        for entry in self.context_bus.find_for_agent(&self.identity.id) {
            context.insert(entry.key, entry.value);
        }

        // Build the prompt
        let mut template_vars = HashMap::new();
        template_vars.insert("name".to_string(), self.identity.name.clone());
        template_vars.insert(
            "task".to_string(),
            format!("{}\n{}", task.goal, task.description),
        );
        template_vars.insert(
            "context".to_string(),
            serde_json::to_string_pretty(&context).unwrap_or_default(),
        );

        let prompt = self
            .templates
            .render("worker-execute", &template_vars)
            .unwrap_or_else(|_| {
                format!(
                    "You are {}, a specialist.\n\n## Task\n{}\n\n## Context\n{}",
                    self.identity.name,
                    task.goal,
                    serde_json::to_string_pretty(&context).unwrap_or_default()
                )
            });

        // Execute via the LLM executor
        let result = self.executor.execute(prompt, context).await;

        let elapsed = start.elapsed();

        match result {
            Ok(output) => {
                let mut health = self.health.write().await;
                health.status = TeamAgentStatus::Done;
                health.tasks_completed += 1;
                health.tasks_in_progress = 0;
                health.last_heartbeat = chrono::Utc::now();

                Ok(TaskResult {
                    task_id: task.id,
                    agent_id: self.identity.id,
                    success: true,
                    result: output,
                    artifacts: Vec::new(),
                    iterations_used: 1,
                    tokens_used: 0, // tracked externally
                    duration_ms: elapsed.as_millis() as u64,
                })
            }
            Err(e) => {
                let mut health = self.health.write().await;
                health.status = TeamAgentStatus::Error;
                health.tasks_failed += 1;
                health.tasks_in_progress = 0;
                health.error_count += 1;
                health.last_error = Some(e.to_string());
                health.last_heartbeat = chrono::Utc::now();

                Err(e)
            }
        }
    }

    /// Get the mental model.
    pub async fn mental_model(&self) -> MentalModel {
        self.mental_model.read().await.clone()
    }

    /// Get the file system scope.
    pub fn file_system(&self) -> &ScopedFileSystem {
        &self.fs
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_executor() -> SharedExecutor {
        SharedExecutor::new(Box::new(|prompt, _| {
            Box::pin(async move { Ok(format!("EXECUTED: {}", prompt.chars().take(50).collect::<String>())) })
        }))
    }

    #[tokio::test]
    async fn test_worker_creation() {
        let executor = make_test_executor();
        let bus = ContextBus::new();
        let msg_bus = MessageBus::new();
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        let worker = Worker::new(
            "TestWorker",
            vec!["rust".into()],
            None,
            executor,
            bus,
            msg_bus,
            fs,
        );

        assert_eq!(worker.identity().role, TeamRole::Worker);
        assert_eq!(worker.identity().name, "TestWorker");
    }

    #[tokio::test]
    async fn test_execute_task() {
        let executor = make_test_executor();
        let bus = ContextBus::new();
        let msg_bus = MessageBus::new();
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        let worker = Worker::new(
            "W1",
            vec!["code".into()],
            None,
            executor,
            bus,
            msg_bus,
            fs,
        );

        let task = TeamTask::new("Write a function");
        let result = worker.execute_task(&task).await.unwrap();

        assert!(result.success);
        assert!(result.result.contains("EXECUTED"));
    }

    #[tokio::test]
    async fn test_health_tracking() {
        let executor = make_test_executor();
        let bus = ContextBus::new();
        let msg_bus = MessageBus::new();
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        let worker = Worker::new(
            "W2",
            vec![],
            None,
            executor,
            bus,
            msg_bus,
            fs,
        );

        let health = worker.health().await;
        assert_eq!(health.status, TeamAgentStatus::Idle);
        assert_eq!(health.tasks_completed, 0);

        let task = TeamTask::new("Do something");
        worker.execute_task(&task).await.unwrap();

        let health = worker.health().await;
        assert_eq!(health.status, TeamAgentStatus::Done);
        assert_eq!(health.tasks_completed, 1);
    }
}
