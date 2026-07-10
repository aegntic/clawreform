//! Template registry — reusable prompt templates with variable substitution.
//!
//! Supports loading templates from strings or files, variable extraction,
//! and `{{variable}}` substitution.

use crate::error::{TeamError, TeamResult};
use crate::types::{PromptTemplate, TeamRole};
use dashmap::DashMap;
use std::collections::HashSet;
use std::sync::Arc;

/// Registry for reusable prompt templates.
#[derive(Debug, Clone)]
pub struct TemplateRegistry {
    templates: Arc<DashMap<String, PromptTemplate>>,
}

impl TemplateRegistry {
    /// Create a new empty template registry.
    pub fn new() -> Self {
        Self {
            templates: Arc::new(DashMap::new()),
        }
    }

    /// Create a registry pre-loaded with built-in templates.
    pub fn with_builtins() -> Self {
        let registry = Self::new();
        for template in builtin_templates() {
            registry.register(template);
        }
        registry
    }

    /// Register a template.
    pub fn register(&self, template: PromptTemplate) {
        self.templates.insert(template.id.clone(), template);
    }

    /// Get a template by ID.
    pub fn get(&self, id: &str) -> TeamResult<PromptTemplate> {
        self.templates
            .get(id)
            .map(|t| t.value().clone())
            .ok_or_else(|| TeamError::Template {
                template_id: id.to_string(),
                reason: "Template not found".into(),
            })
    }

    /// Render a template with variable substitution.
    ///
    /// Replaces `{{variable}}` placeholders with values from the context.
    pub fn render(
        &self,
        template_id: &str,
        variables: &std::collections::HashMap<String, String>,
    ) -> TeamResult<String> {
        let template = self.get(template_id)?;
        render_template(&template.template, variables)
    }

    /// Render a template string directly.
    pub fn render_string(
        template_str: &str,
        variables: &std::collections::HashMap<String, String>,
    ) -> TeamResult<String> {
        render_template(template_str, variables)
    }

    /// Extract `{{variable}}` names from a template string.
    pub fn extract_variables(template_str: &str) -> Vec<String> {
        let mut vars = HashSet::new();
        let mut chars = template_str.chars().peekable();

        while let Some(c) = chars.next() {
            if c == '{' && chars.peek() == Some(&'{') {
                chars.next(); // consume second {
                let mut name = String::new();
                while let Some(&next) = chars.peek() {
                    if next == '}' {
                        chars.next(); // consume }
                        if chars.peek() == Some(&'}') {
                            chars.next(); // consume second }
                            if !name.is_empty() {
                                vars.insert(name.trim().to_string());
                            }
                            break;
                        }
                    }
                    name.push(chars.next().unwrap());
                }
            }
        }

        vars.into_iter().collect()
    }

    /// List all template IDs.
    pub fn list_ids(&self) -> Vec<String> {
        self.templates.iter().map(|t| t.key().clone()).collect()
    }

    /// List templates filtered by role.
    pub fn list_by_role(&self, role: TeamRole) -> Vec<PromptTemplate> {
        self.templates
            .iter()
            .filter(|t| t.value().role == Some(role) || t.value().role.is_none())
            .map(|t| t.value().clone())
            .collect()
    }

    /// Remove a template.
    pub fn remove(&self, id: &str) -> bool {
        self.templates.remove(id).is_some()
    }

    /// Count registered templates.
    pub fn len(&self) -> usize {
        self.templates.len()
    }

    /// Check if empty.
    pub fn is_empty(&self) -> bool {
        self.templates.is_empty()
    }
}

impl Default for TemplateRegistry {
    fn default() -> Self {
        Self::with_builtins()
    }
}

/// Render a template string with variable substitution.
fn render_template(
    template_str: &str,
    variables: &std::collections::HashMap<String, String>,
) -> TeamResult<String> {
    let mut result = template_str.to_string();
    let extracted = TemplateRegistry::extract_variables(template_str);

    for var_name in &extracted {
        let placeholder = format!("{{{{{}}}}}", var_name);
        if let Some(value) = variables.get(var_name) {
            result = result.replace(&placeholder, value);
        }
        // If variable not provided, leave placeholder as-is
    }

    Ok(result)
}

// ============================================================================
// Built-in Templates
// ============================================================================

/// Built-in prompt templates for common team operations.
pub fn builtin_templates() -> Vec<PromptTemplate> {
    vec![
        PromptTemplate {
            id: "orchestrator-decompose".to_string(),
            name: "Goal Decomposition".to_string(),
            template: r#"You are {{name}}, the Orchestrator of a multi-agent team.

Your task is to decompose the following goal into sub-tasks that can be assigned to your team leads.

## Goal
{{goal}}

## Available Team Leads
{{team_leads}}

## Instructions
1. Break the goal into 2-4 discrete sub-tasks
2. Assign each sub-task to the most appropriate team lead based on their expertise
3. Define dependencies between sub-tasks if any
4. For each sub-task, provide:
   - A clear goal statement
   - Required expertise
   - Expected output
   - Dependencies (if any)

Respond in JSON format with an array of task objects."#.to_string(),
            variables: vec!["name".to_string(), "goal".to_string(), "team_leads".to_string()],
            description: "Decompose a high-level goal into sub-tasks for team leads".to_string(),
            role: Some(TeamRole::Orchestrator),
        },
        PromptTemplate {
            id: "orchestrator-synthesize".to_string(),
            name: "Result Synthesis".to_string(),
            template: r#"You are {{name}}, the Orchestrator. Your team leads have completed their tasks.

## Original Goal
{{goal}}

## Team Lead Results
{{results}}

## Instructions
1. Review all team lead results
2. Synthesize them into a cohesive summary
3. Identify any gaps or inconsistencies
4. Provide a final assessment of goal completion

Respond with a structured summary."#.to_string(),
            variables: vec!["name".to_string(), "goal".to_string(), "results".to_string()],
            description: "Synthesize team lead results into a final summary".to_string(),
            role: Some(TeamRole::Orchestrator),
        },
        PromptTemplate {
            id: "team-lead-delegate".to_string(),
            name: "Task Delegation".to_string(),
            template: r#"You are {{name}}, a Team Lead specializing in {{domain}}.

## Your Task
{{task}}

## Context
{{context}}

## Available Workers
{{workers}}

## Instructions
1. Analyze the task and determine if it should be delegated to workers or handled by you
2. If delegating, break it into worker-level sub-tasks
3. Assign each sub-task to the most appropriate worker
4. Provide clear instructions for each worker

Respond in JSON format."#.to_string(),
            variables: vec!["name".to_string(), "domain".to_string(), "task".to_string(), "context".to_string(), "workers".to_string()],
            description: "Delegate a task from the orchestrator to workers".to_string(),
            role: Some(TeamRole::TeamLead),
        },
        PromptTemplate {
            id: "team-lead-review".to_string(),
            name: "Quality Review".to_string(),
            template: r#"You are {{name}}, a Team Lead specializing in {{domain}}.

Review the following work completed by your worker.

## Original Task
{{task}}

## Worker Output
{{output}}

## Instructions
1. Evaluate quality and completeness
2. Check for errors or omissions
3. Determine if the task meets requirements
4. If not satisfactory, provide specific feedback for revision

Respond with:
- quality_score: 1-10
- approved: boolean
- feedback: string
- revision_needed: boolean"#.to_string(),
            variables: vec!["name".to_string(), "domain".to_string(), "task".to_string(), "output".to_string()],
            description: "Review worker output for quality".to_string(),
            role: Some(TeamRole::TeamLead),
        },
        PromptTemplate {
            id: "worker-execute".to_string(),
            name: "Task Execution".to_string(),
            template: r#"You are {{name}}, a specialist worker.

## Your Task
{{task}}

## Context
{{context}}

## Instructions
1. Complete the task to the best of your ability
2. Be thorough and precise
3. Provide your output in a clear, structured format
4. If you encounter issues, describe them clearly

Focus on producing high-quality work that your team lead will review."#.to_string(),
            variables: vec!["name".to_string(), "task".to_string(), "context".to_string()],
            description: "Execute a specific task as a worker".to_string(),
            role: Some(TeamRole::Worker),
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_variables() {
        let vars = TemplateRegistry::extract_variables("Hello {{name}}, you are {{role}}.");
        assert_eq!(vars.len(), 2);
        assert!(vars.contains(&"name".to_string()));
        assert!(vars.contains(&"role".to_string()));
    }

    #[test]
    fn test_extract_no_variables() {
        let vars = TemplateRegistry::extract_variables("No variables here.");
        assert!(vars.is_empty());
    }

    #[test]
    fn test_render_template() {
        let mut vars = std::collections::HashMap::new();
        vars.insert("name".to_string(), "Alice".to_string());
        vars.insert("role".to_string(), "Orchestrator".to_string());

        let result = TemplateRegistry::render_string(
            "Hello {{name}}, you are {{role}}.",
            &vars,
        )
        .unwrap();
        assert_eq!(result, "Hello Alice, you are Orchestrator.");
    }

    #[test]
    fn test_render_missing_variable() {
        let vars = std::collections::HashMap::new();
        let result = TemplateRegistry::render_string("Hello {{name}}.", &vars).unwrap();
        assert_eq!(result, "Hello {{name}}.");
    }

    #[test]
    fn test_registry_builtins() {
        let registry = TemplateRegistry::with_builtins();
        assert!(registry.len() >= 5);
        assert!(registry.get("orchestrator-decompose").is_ok());
        assert!(registry.get("nonexistent").is_err());
    }

    #[test]
    fn test_registry_render() {
        let registry = TemplateRegistry::with_builtins();
        let mut vars = std::collections::HashMap::new();
        vars.insert("name".to_string(), "Boss".to_string());
        vars.insert("goal".to_string(), "Build something".to_string());
        vars.insert("team_leads".to_string(), "Code Lead, Design Lead".to_string());

        let result = registry.render("orchestrator-decompose", &vars).unwrap();
        assert!(result.contains("Boss"));
        assert!(result.contains("Build something"));
    }

    #[test]
    fn test_list_by_role() {
        let registry = TemplateRegistry::with_builtins();
        let orchestrator_templates = registry.list_by_role(TeamRole::Orchestrator);
        assert!(orchestrator_templates.len() >= 2);

        let worker_templates = registry.list_by_role(TeamRole::Worker);
        assert_eq!(worker_templates.len(), 1);
    }

    #[test]
    fn test_register_and_remove() {
        let registry = TemplateRegistry::new();
        let tpl = PromptTemplate {
            id: "custom".to_string(),
            name: "Custom".to_string(),
            template: "Hello {{who}}".to_string(),
            variables: vec!["who".to_string()],
            description: String::new(),
            role: None,
        };
        registry.register(tpl);
        assert_eq!(registry.len(), 1);
        assert!(registry.remove("custom"));
        assert!(registry.is_empty());
    }

    #[test]
    fn test_builtin_templates_count() {
        let templates = builtin_templates();
        assert_eq!(templates.len(), 5);
    }
}
