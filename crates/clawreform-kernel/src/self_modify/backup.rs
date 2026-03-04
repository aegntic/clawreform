//! Backup system — creates and restores file backups

use super::types::*;
use std::fs;
use std::path::Path;
use tracing::info;

/// Create a backup of files before modification
pub fn create_backup(
    backup_dir: &Path,
    files: &[FileChange],
    source_dir: &Path,
) -> Result<String, ModifyError> {
    let backup_id = format!("backup_{}", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let backup_path = backup_dir.join(&backup_id);

    fs::create_dir_all(&backup_path)?;

    for file in files {
        if file.change_type == ChangeType::Create {
            continue; // No need to backup new files
        }

        let src = source_dir.join(&file.path);
        let dst = backup_path.join(&file.path);

        if src.exists() {
            fs::create_dir_all(dst.parent().unwrap())?;
            fs::copy(&src, &dst)?;
            info!("Backed up: {:?}", file.path);
        }
    }

    // Save backup metadata
    let metadata = BackupMetadata {
        id: backup_id.clone(),
        created_at: chrono::Utc::now(),
        files: files.to_vec(),
    };
    let metadata_path = backup_path.join("metadata.json");
    let metadata_json = serde_json::to_string_pretty(&metadata)?;
    fs::write(&metadata_path, metadata_json)?;

    info!("Created backup: {}", backup_id);
    Ok(backup_id)
}

/// Restore files from a backup
pub fn restore_backup(
    backup_dir: &Path,
    backup_id: &str,
    source_dir: &Path,
) -> Result<(), ModifyError> {
    let backup_path = backup_dir.join(backup_id);

    if !backup_path.exists() {
        return Err(ModifyError::Modification(format!(
            "Backup not found: {}",
            backup_id
        )));
    }

    // Load metadata
    let metadata_path = backup_path.join("metadata.json");
    let metadata_json = fs::read_to_string(&metadata_path)?;
    let metadata: BackupMetadata = serde_json::from_str(&metadata_json)?;

    // Restore files
    for file in &metadata.files {
        let src = backup_path.join(&file.path);
        let dst = source_dir.join(&file.path);

        if src.exists() {
            fs::create_dir_all(dst.parent().unwrap())?;
            fs::copy(&src, &dst)?;
            info!("Restored: {:?}", file.path);
        } else if file.change_type == ChangeType::Create {
            // File was created by modification, delete it
            if dst.exists() {
                fs::remove_file(&dst)?;
                info!("Removed created file: {:?}", file.path);
            }
        }
    }

    info!("Restored from backup: {}", backup_id);
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
struct BackupMetadata {
    id: String,
    created_at: chrono::DateTime<chrono::Utc>,
    files: Vec<FileChange>,
}

use serde::{Deserialize, Serialize};
