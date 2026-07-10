//! Directed message bus for inter-agent communication.
//!
//! Routes messages between agents in the team hierarchy.
//! Supports publish/subscribe patterns and direct addressing.

use crate::error::{TeamError, TeamResult};
use crate::{AgentId, DelegationMessage, MessageType, TaskId, MessageDirection};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::broadcast;

/// Message handler function type.
pub type MessageHandler = Arc<dyn Fn(DelegationMessage) + Send + Sync>;

/// Directed message bus for routing messages between team agents.
///
/// Supports:
/// - Direct agent-to-agent messaging
/// - Broadcast to all agents
/// - Role-based routing
/// - Subscription-based message delivery
#[derive(Clone)]
pub struct MessageBus {
    /// Direct message channels per agent.
    senders: Arc<DashMap<AgentId, tokio::sync::mpsc::UnboundedSender<DelegationMessage>>>,
    /// Broadcast channel for team-wide messages.
    broadcast_tx: broadcast::Sender<DelegationMessage>,
    /// Subscribers by message type.
    type_subscribers: Arc<DashMap<MessageType, Vec<Arc<MessageHandler>>>>,
}

impl MessageBus {
    /// Create a new message bus.
    pub fn new() -> Self {
        let (broadcast_tx, _) = broadcast::channel(1024);
        Self {
            senders: Arc::new(DashMap::new()),
            broadcast_tx,
            type_subscribers: Arc::new(DashMap::new()),
        }
    }

    /// Register an agent to receive direct messages.
    /// Returns the receiver for the agent's message queue.
    pub fn register(
        &self,
        agent_id: AgentId,
    ) -> tokio::sync::mpsc::UnboundedReceiver<DelegationMessage> {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        self.senders.insert(agent_id, tx);
        rx
    }

    /// Unregister an agent from the message bus.
    pub fn unregister(&self, agent_id: &AgentId) {
        self.senders.remove(agent_id);
    }

    /// Send a direct message to a specific agent.
    pub fn send(&self, message: DelegationMessage) -> TeamResult<()> {
        if let Some(sender) = self.senders.get(&message.to_id) {
            sender.send(message.clone()).ok();
        }

        // Also broadcast to type subscribers
        let _ = self.broadcast_tx.send(message);

        Ok(())
    }

    /// Send a message to a specific agent (returns error if agent not registered).
    pub fn send_direct(&self, message: DelegationMessage) -> TeamResult<()> {
        if let Some(sender) = self.senders.get(&message.to_id) {
            sender.send(message).ok();
            Ok(())
        } else {
            Err(TeamError::AgentError {
                agent_id: message.to_id,
                reason: "Agent not registered with message bus".into(),
            })
        }
    }

    /// Subscribe to all messages of a specific type.
    pub fn subscribe_type(&self, msg_type: MessageType, handler: Arc<MessageHandler>) {
        self.type_subscribers
            .entry(msg_type)
            .or_default()
            .push(handler);
    }

    /// Get a broadcast receiver for all messages.
    pub fn subscribe_broadcast(&self) -> broadcast::Receiver<DelegationMessage> {
        self.broadcast_tx.subscribe()
    }

    /// Dispatch a message to all registered type handlers.
    pub fn dispatch_to_handlers(&self, message: &DelegationMessage) {
        if let Some(handlers) = self.type_subscribers.get(&message.msg_type) {
            for handler in handlers.iter() {
                handler(message.clone());
            }
        }
    }

    /// Create a task assignment message.
    pub fn task_assign(from: AgentId, to: AgentId, task_id: TaskId) -> DelegationMessage {
        DelegationMessage::new(MessageType::TaskAssign, from, to)
            .with_task(task_id)
            .with_direction(MessageDirection::Down)
    }

    /// Create a task result message.
    pub fn task_result(from: AgentId, to: AgentId, task_id: TaskId) -> DelegationMessage {
        DelegationMessage::new(MessageType::TaskResult, from, to)
            .with_task(task_id)
            .with_direction(MessageDirection::Up)
    }

    /// Create a task failure message.
    pub fn task_failed(from: AgentId, to: AgentId, task_id: TaskId) -> DelegationMessage {
        DelegationMessage::new(MessageType::TaskFailed, from, to)
            .with_task(task_id)
            .with_direction(MessageDirection::Up)
    }

    /// Check if an agent is registered.
    pub fn is_registered(&self, agent_id: &AgentId) -> bool {
        self.senders.contains_key(agent_id)
    }

    /// Count registered agents.
    pub fn registered_count(&self) -> usize {
        self.senders.len()
    }
}

impl Default for MessageBus {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_register_and_send() {
        let bus = MessageBus::new();
        let alice = AgentId::new();
        let bob = AgentId::new();

        let mut bob_rx = bus.register(bob);

        let msg = MessageBus::task_assign(alice, bob, TaskId::new());
        bus.send(msg).unwrap();

        let received = bob_rx.recv().await.unwrap();
        assert_eq!(received.msg_type, MessageType::TaskAssign);
        assert_eq!(received.from_id, alice);
    }

    #[tokio::test]
    async fn test_send_direct_not_registered() {
        let bus = MessageBus::new();
        let alice = AgentId::new();
        let ghost = AgentId::new();

        let msg = DelegationMessage::new(MessageType::Ping, alice, ghost);
        assert!(bus.send_direct(msg).is_err());
    }

    #[tokio::test]
    async fn test_unregister() {
        let bus = MessageBus::new();
        let agent = AgentId::new();
        let rx = bus.register(agent);
        drop(rx);
        bus.unregister(&agent);
        assert!(!bus.is_registered(&agent));
    }

    #[tokio::test]
    async fn test_broadcast() {
        let bus = MessageBus::new();
        let mut sub = bus.subscribe_broadcast();

        let alice = AgentId::new();
        let bob = AgentId::new();
        let _rx = bus.register(bob);

        let msg = DelegationMessage::new(MessageType::StatusReport, alice, bob);
        bus.send(msg).unwrap();

        let received = sub.recv().await.unwrap();
        assert_eq!(received.msg_type, MessageType::StatusReport);
    }

    #[test]
    fn test_registered_count() {
        let bus = MessageBus::new();
        assert_eq!(bus.registered_count(), 0);
        let a = AgentId::new();
        let _rx = bus.register(a);
        assert_eq!(bus.registered_count(), 1);
    }
}
