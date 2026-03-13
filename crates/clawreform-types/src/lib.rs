//! Core types and traits for the ClawReform Agent Operating System.
//!
//! This crate defines all shared data structures used across the ClawReform kernel,
//! runtime, memory substrate, and wire protocol. It contains no business logic.

pub mod agent;
pub mod approval;
pub mod capability;
pub mod company;
pub mod config;
pub mod error;
pub mod event;
pub mod manifest_signing;
pub mod media;
pub mod memory;
pub mod message;
pub mod model_catalog;
pub mod openclaw;
pub mod scheduler;
pub mod serde_compat;
pub mod taint;
pub mod tool;
pub mod tool_compat;
pub mod webhook;

// Re-export commonly used OpenClaw types at crate root
pub use openclaw::{
    ActivationMode, AgentAddressing, AgentCapabilities, AgentConstraints, AgentContract,
    AgentDependencies, AgentHealth, AgentKind, ArtifactId, ArtifactRecord, DispatchDecision,
    DispatchRecord, EvaluationDecision, EvaluationResult, EvaluationScores, EventId,
    LifecycleEvent, LifecycleState, MemoryEnvelope, MemoryObject, MemoryTier, MemoryVisibility,
    RegistryRecord, RepairAction, RepairActionType, RetentionClass, TaskId, TaskPacket,
    TaskPriority, TraceId, SCHEMA_VERSION as OPENCLAW_SCHEMA_VERSION,
};
