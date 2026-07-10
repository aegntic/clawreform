//! Agent Team Orchestration for ClawReform.
//!
//! 3-tier multi-agent hierarchy: **Orchestrator → Team Lead → Worker**
//!
//! - **Orchestrator**: Receives goals, decomposes into tasks, assigns to team leads, synthesizes results
//! - **Team Lead**: Manages workers, delegates tasks, reviews output quality
//! - **Worker**: Executes specific tasks within domain scope
//!
//! Key components:
//! - [`ContextBus`]: Shared KV store with scoping, TTL, and tag queries
//! - [`MessageBus`]: Directed message routing between agent tiers
//! - [`ScopedFileSystem`]: Path-sandboxed file access per agent
//! - [`TemplateRegistry`]: Reusable prompt templates with variable substitution
//! - [`TeamManager`]: High-level API to configure, build, and run an agent team

pub mod context_bus;
pub mod error;
pub mod message_bus;
pub mod orchestrator;
pub mod scoped_fs;
pub mod team_lead;
pub mod template;
pub mod types;
pub mod worker;

pub use context_bus::ContextBus;
pub use error::{TeamError, TeamResult};
pub use message_bus::MessageBus;
pub use orchestrator::Orchestrator;
pub use scoped_fs::ScopedFileSystem;
pub use team_lead::{TeamLead, TeamManager};
pub use template::{TemplateRegistry, builtin_templates};
pub use types::*;
pub use worker::Worker;
