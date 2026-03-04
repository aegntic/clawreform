//! Self-Modification Module — enables ClawReform to modify itself safely.
//!
//! This module provides:
//! - Code analysis and patch generation
//! - Safe modification with backups
//! - Automatic validation (build, test, clippy)
//! - Rollback on failure
//! - Integration with approval system

pub mod analyzer;
pub mod backup;
pub mod modifier;
pub mod types;
pub mod validate;

use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};

pub use types::*;

/// Self-modification manager
pub struct SelfModifier {
    /// Source directory (clawreform_3)
    source_dir: PathBuf,
    /// Backup directory
    backup_dir: PathBuf,
    /// Current modification state
    state: Arc<RwLock<ModifyState>>,
    /// Configuration
    config: SelfModifyConfig,
}

impl SelfModifier {
    /// Create a new self-modifier
    pub fn new(source_dir: PathBuf, backup_dir: PathBuf, config: SelfModifyConfig) -> Self {
        Self {
            source_dir,
            backup_dir,
            state: Arc::new(RwLock::new(ModifyState::default())),
            config,
        }
    }

    /// Analyze a modification request
    pub async fn analyze(&self, request: &str) -> Result<ModifyPlan, ModifyError> {
        info!("Analyzing modification request: {}", request);

        let mut state = self.state.write().await;
        state.last_request = Some(request.to_string());

        // Use analyzer to create a plan
        let plan = analyzer::analyze_request(request, &self.source_dir)?;

        // Check safety limits
        if plan.files.len() > self.config.max_files_per_mod {
            return Err(ModifyError::TooManyFiles(
                plan.files.len(),
                self.config.max_files_per_mod,
            ));
        }

        state.current_plan = Some(plan.clone());
        Ok(plan)
    }

    /// Apply a modification with full safety checks
    pub async fn apply(&self, plan_id: &str) -> Result<ModifyResult, ModifyError> {
        let state = self.state.read().await;
        let plan = state
            .current_plan
            .as_ref()
            .ok_or(ModifyError::NoPlan)?
            .clone();
        drop(state);

        if plan.id != plan_id {
            return Err(ModifyError::PlanMismatch);
        }

        info!("Applying modification plan: {}", plan_id);

        // 1. Create backup
        let backup_id = backup::create_backup(&self.backup_dir, &plan.files, &self.source_dir)?;

        let mut state = self.state.write().await;
        state.current_backup = Some(backup_id.clone());
        drop(state);

        // 2. Apply changes
        modifier::apply_plan(&plan, &self.source_dir)?;

        // 3. Validate
        match validate::run_validation(&self.source_dir).await {
            Ok(result) if result.success => {
                info!("Validation passed!");
                Ok(ModifyResult {
                    success: true,
                    backup_id,
                    files_modified: plan.files.len(),
                    validation: result,
                })
            }
            Ok(result) => {
                warn!("Validation failed, rolling back");
                if self.config.auto_rollback {
                    backup::restore_backup(&self.backup_dir, &backup_id, &self.source_dir)?;
                }
                Err(ModifyError::ValidationFailed(result))
            }
            Err(e) => {
                error!("Validation error: {}", e);
                if self.config.auto_rollback {
                    backup::restore_backup(&self.backup_dir, &backup_id, &self.source_dir)?;
                }
                Err(e)
            }
        }
    }

    /// Rollback to previous state
    pub async fn rollback(&self) -> Result<RollbackResult, ModifyError> {
        let state = self.state.read().await;
        let backup_id = state
            .current_backup
            .as_ref()
            .ok_or(ModifyError::NoBackup)?
            .clone();
        drop(state);

        info!("Rolling back to backup: {}", backup_id);
        backup::restore_backup(&self.backup_dir, &backup_id, &self.source_dir)?;

        Ok(RollbackResult {
            success: true,
            backup_id,
        })
    }

    /// Get current status
    pub async fn status(&self) -> ModifyStatus {
        let state = self.state.read().await;
        ModifyStatus {
            enabled: self.config.enabled,
            current_plan: state.current_plan.clone(),
            current_backup: state.current_backup.clone(),
            last_request: state.last_request.clone(),
        }
    }
}
