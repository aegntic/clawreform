//! Trace context for OpenClaw observability.
//!
//! Provides task-local storage for TraceId propagation across the agent
//! execution lifecycle. A single TraceId flows through:
//! - Task dispatch
//! - Agent loop execution
//! - Tool invocations
//! - Artifact creation
//! - Evaluation submissions

use clawreform_types::openclaw::TraceId;
use std::cell::RefCell;

tokio::task_local! {
    /// Task-local storage for the current trace ID.
    /// Set at the start of agent loop execution and propagated
    /// through all child operations.
    pub static TRACE_CONTEXT: RefCell<Option<TraceId>>;
}

/// Get the current trace ID from the task-local context.
///
/// Returns None if called outside of a trace context or if
/// no trace ID has been set.
pub fn current_trace_id() -> Option<TraceId> {
    TRACE_CONTEXT.try_with(|c| *c.borrow()).ok().flatten()
}

/// Set the trace ID in the current task-local context.
///
/// This should be called at the start of agent loop execution
/// to establish the trace for all subsequent operations.
pub fn set_trace_id(trace_id: TraceId) {
    let _ = TRACE_CONTEXT.try_with(|c| {
        *c.borrow_mut() = Some(trace_id);
    });
}

/// Clear the trace ID from the current task-local context.
///
/// Useful when ending a trace scope explicitly.
pub fn clear_trace_id() {
    let _ = TRACE_CONTEXT.try_with(|c| {
        *c.borrow_mut() = None;
    });
}

/// Generate a new trace ID for a new operation.
///
/// Creates a unique TraceId that can be used to correlate
/// all operations in a single task execution flow.
pub fn new_trace_id() -> TraceId {
    TraceId::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_trace_context_roundtrip() {
        let trace_id = new_trace_id();

        TRACE_CONTEXT
            .scope(RefCell::new(None), async {
                set_trace_id(trace_id.clone());
                let retrieved = current_trace_id();
                assert_eq!(retrieved, Some(trace_id));
            })
            .await;
    }

    #[tokio::test]
    async fn test_no_trace_outside_context() {
        // Outside of TRACE_CONTEXT scope, should return None
        let result = current_trace_id();
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_clear_trace() {
        let trace_id = new_trace_id();

        TRACE_CONTEXT
            .scope(RefCell::new(None), async {
                set_trace_id(trace_id);
                assert!(current_trace_id().is_some());

                clear_trace_id();
                assert!(current_trace_id().is_none());
            })
            .await;
    }
}
