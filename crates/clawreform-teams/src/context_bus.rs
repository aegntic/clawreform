//! Shared context bus — KV store with TTL, scoping, and tag queries.
//!
//! Agents share state through the context bus. Entries can be scoped to
//! specific agents, expire after a TTL, and be queried by tags.

use crate::error::{TeamError, TeamResult};
use crate::types::ContextEntry;
use crate::AgentId;
use dashmap::DashMap;
use std::collections::HashSet;
use std::sync::Arc;

/// Shared context bus for inter-agent state.
///
/// Thread-safe KV store where agents can read/write context entries.
/// Supports TTL expiration, tag-based queries, and agent scoping.
#[derive(Debug, Clone)]
pub struct ContextBus {
    entries: Arc<DashMap<String, ContextEntry>>,
    /// Cleanup task handle.
    _gc_handle: Arc<std::sync::Mutex<Option<tokio::task::JoinHandle<()>>>>,
}

impl ContextBus {
    /// Create a new context bus.
    pub fn new() -> Self {
        let entries: Arc<DashMap<String, ContextEntry>> = Arc::new(DashMap::new());
        let entries_gc = Arc::clone(&entries);

        let handle = tokio::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(60)).await;
                entries_gc.retain(|_, entry| !entry.is_expired());
            }
        });

        Self {
            entries,
            _gc_handle: Arc::new(std::sync::Mutex::new(Some(handle))),
        }
    }

    /// Insert a context entry.
    pub fn set(&self, entry: ContextEntry) {
        self.entries.insert(entry.key.clone(), entry);
    }

    /// Get a context entry by key.
    pub fn get(&self, key: &str) -> TeamResult<ContextEntry> {
        self.entries
            .get(key)
            .filter(|entry| !entry.is_expired())
            .map(|entry| entry.value().clone())
            .ok_or_else(|| TeamError::ContextBus(format!("Key not found: {key}")))
    }

    /// Get a context entry's value as a string.
    pub fn get_string(&self, key: &str) -> TeamResult<String> {
        let entry = self.get(key)?;
        match entry.value {
            serde_json::Value::String(s) => Ok(s),
            other => Ok(other.to_string()),
        }
    }

    /// Check if a key exists and is not expired.
    pub fn exists(&self, key: &str) -> bool {
        self.entries
            .get(key)
            .map(|e| !e.is_expired())
            .unwrap_or(false)
    }

    /// Delete a context entry.
    pub fn delete(&self, key: &str) -> bool {
        self.entries.remove(key).is_some()
    }

    /// Find entries by tag.
    pub fn find_by_tag(&self, tag: &str) -> Vec<ContextEntry> {
        self.entries
            .iter()
            .filter(|entry| {
                !entry.is_expired() && entry.value().tags.iter().any(|t| t == tag)
            })
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Find entries by tags (all must match).
    pub fn find_by_tags(&self, tags: &[&str]) -> Vec<ContextEntry> {
        let tag_set: HashSet<&str> = tags.iter().copied().collect();
        self.entries
            .iter()
            .filter(|entry| {
                if entry.is_expired() {
                    return false;
                }
                let entry_tags: HashSet<&str> =
                    entry.value().tags.iter().map(|s| s.as_str()).collect();
                tag_set.is_subset(&entry_tags)
            })
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Find entries visible to a specific agent.
    pub fn find_for_agent(&self, agent_id: &AgentId) -> Vec<ContextEntry> {
        self.entries
            .iter()
            .filter(|entry| {
                if entry.is_expired() {
                    return false;
                }
                // Visible if scope is empty (public) or agent is in scope
                entry.value().scope.is_empty()
                    || entry.value().scope.iter().any(|id| id == agent_id)
            })
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Set a simple key-value pair (convenience method).
    pub fn set_value(
        &self,
        key: &str,
        value: serde_json::Value,
        author_id: AgentId,
    ) {
        let entry = ContextEntry::new(key, value, author_id);
        self.set(entry);
    }

    /// Set a string value.
    pub fn set_string(&self, key: &str, value: &str, author_id: AgentId) {
        self.set_value(key, serde_json::Value::String(value.to_string()), author_id);
    }

    /// Get all non-expired entries count.
    pub fn len(&self) -> usize {
        self.entries
            .iter()
            .filter(|e| !e.is_expired())
            .count()
    }

    /// Check if the bus is empty.
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    /// Clear all entries.
    pub fn clear(&self) {
        self.entries.clear();
    }

    /// List all keys.
    pub fn keys(&self) -> Vec<String> {
        self.entries
            .iter()
            .filter(|e| !e.is_expired())
            .map(|e| e.key().clone())
            .collect()
    }

    /// Prune expired entries immediately.
    pub fn prune(&self) {
        self.entries.retain(|_, entry| !entry.is_expired());
    }
}

impl Default for ContextBus {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_basic_operations() {
        let bus = ContextBus::new();
        let agent = AgentId::new();

        bus.set_string("greeting", "hello", agent);
        assert!(bus.exists("greeting"));
        assert_eq!(bus.get_string("greeting").unwrap(), "hello");
        assert_eq!(bus.len(), 1);
    }

    #[tokio::test]
    async fn test_tags() {
        let bus = ContextBus::new();
        let agent = AgentId::new();

        let mut entry = ContextEntry::new("k1", serde_json::json!("v1"), agent);
        entry.tags = vec!["code".into(), "rust".into()];
        bus.set(entry);

        let mut entry2 = ContextEntry::new("k2", serde_json::json!("v2"), agent);
        entry2.tags = vec!["code".into(), "go".into()];
        bus.set(entry2);

        let code = bus.find_by_tag("code");
        assert_eq!(code.len(), 2);

        let rust = bus.find_by_tag("rust");
        assert_eq!(rust.len(), 1);

        let both = bus.find_by_tags(&["code", "rust"]);
        assert_eq!(both.len(), 1);
    }

    #[tokio::test]
    async fn test_scoping() {
        let bus = ContextBus::new();
        let alice = AgentId::new();
        let bob = AgentId::new();

        let mut entry = ContextEntry::new("secret", serde_json::json!("hidden"), alice);
        entry.scope = vec![alice];
        bus.set(entry);

        let mut entry2 = ContextEntry::new("public", serde_json::json!("visible"), alice);
        entry2.scope = vec![];
        bus.set(entry2);

        let alice_visible = bus.find_for_agent(&alice);
        assert_eq!(alice_visible.len(), 2);

        let bob_visible = bus.find_for_agent(&bob);
        assert_eq!(bob_visible.len(), 1);
        assert_eq!(bob_visible[0].key, "public");
    }

    #[tokio::test]
    async fn test_delete() {
        let bus = ContextBus::new();
        let agent = AgentId::new();

        bus.set_string("temp", "value", agent);
        assert!(bus.delete("temp"));
        assert!(!bus.exists("temp"));
        assert!(!bus.delete("temp")); // already gone
    }

    #[tokio::test]
    async fn test_clear() {
        let bus = ContextBus::new();
        let agent = AgentId::new();

        bus.set_string("a", "1", agent);
        bus.set_string("b", "2", agent);
        assert_eq!(bus.len(), 2);
        bus.clear();
        assert!(bus.is_empty());
    }
}
