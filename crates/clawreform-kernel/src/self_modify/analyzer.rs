//! Request analyzer — converts natural language to modification plans

use super::types::*;
use std::path::{Path, PathBuf};
use tracing::info;

/// Analyze a modification request and create a plan
pub fn analyze_request(request: &str, _source_dir: &Path) -> Result<ModifyPlan, ModifyError> {
    info!("Analyzing request: {}", request);

    // Parse the request to understand what needs to be modified
    let intent = parse_intent(request);
    let affected_files = find_affected_files(&intent, _source_dir)?;
    let complexity = estimate_complexity(&affected_files);
    let risk = assess_risk(&intent, &affected_files);

    let id = generate_plan_id();

    Ok(ModifyPlan {
        id,
        description: intent.description,
        files: affected_files,
        complexity,
        requires_approval: risk >= RiskLevel::High,
        risk_level: risk,
    })
}

#[derive(Debug)]
struct Intent {
    description: String,
    target_area: TargetArea,
    action: Action,
}

#[derive(Debug)]
enum TargetArea {
    Api,
    Kernel,
    Runtime,
    Skills,
    Hands,
    Config,
    Cli,
    Channels,
    Multiple,
}

#[derive(Debug)]
enum Action {
    AddEndpoint,
    AddFeature,
    ModifyBehavior,
    AddConfig,
    AddSkill,
    AddHand,
    Fix,
    Refactor,
}

fn parse_intent(request: &str) -> Intent {
    let request_lower = request.to_lowercase();

    // Detect target area
    let target_area = if request_lower.contains("api") || request_lower.contains("endpoint") {
        TargetArea::Api
    } else if request_lower.contains("skill") {
        TargetArea::Skills
    } else if request_lower.contains("hand") {
        TargetArea::Hands
    } else if request_lower.contains("config") {
        TargetArea::Config
    } else if request_lower.contains("cli") || request_lower.contains("command") {
        TargetArea::Cli
    } else if request_lower.contains("channel") {
        TargetArea::Channels
    } else if request_lower.contains("kernel") || request_lower.contains("core") {
        TargetArea::Kernel
    } else if request_lower.contains("runtime") || request_lower.contains("agent") {
        TargetArea::Runtime
    } else {
        TargetArea::Multiple
    };

    // Detect action
    let action = if request_lower.contains("add") || request_lower.contains("new") {
        if request_lower.contains("endpoint") {
            Action::AddEndpoint
        } else if request_lower.contains("skill") {
            Action::AddSkill
        } else if request_lower.contains("hand") {
            Action::AddHand
        } else if request_lower.contains("config") {
            Action::AddConfig
        } else {
            Action::AddFeature
        }
    } else if request_lower.contains("fix") || request_lower.contains("bug") {
        Action::Fix
    } else if request_lower.contains("refactor") || request_lower.contains("improve") {
        Action::Refactor
    } else if request_lower.contains("change") || request_lower.contains("modify") {
        Action::ModifyBehavior
    } else {
        Action::AddFeature
    };

    Intent {
        description: request.to_string(),
        target_area,
        action,
    }
}

fn find_affected_files(
    intent: &Intent,
    __source_dir: &Path,
) -> Result<Vec<FileChange>, ModifyError> {
    let mut files = Vec::new();

    match intent.target_area {
        TargetArea::Api => {
            files.push(FileChange {
                path: PathBuf::from("crates/clawreform-api/src/server.rs"),
                change_type: ChangeType::Modify,
                diff_preview: "// Route registration will be added".to_string(),
                lines_added: 5,
                lines_removed: 0,
            });
            files.push(FileChange {
                path: PathBuf::from("crates/clawreform-api/src/routes.rs"),
                change_type: ChangeType::Modify,
                diff_preview: "// Handler function will be added".to_string(),
                lines_added: 30,
                lines_removed: 0,
            });
        }
        TargetArea::Kernel => {
            files.push(FileChange {
                path: PathBuf::from("crates/clawreform-kernel/src/kernel.rs"),
                change_type: ChangeType::Modify,
                diff_preview: "// Kernel changes".to_string(),
                lines_added: 20,
                lines_removed: 5,
            });
        }
        TargetArea::Skills => {
            files.push(FileChange {
                path: PathBuf::from("crates/clawreform-skills/bundled/new-skill/SKILL.md"),
                change_type: ChangeType::Create,
                diff_preview: "// New skill content".to_string(),
                lines_added: 100,
                lines_removed: 0,
            });
        }
        _ => {
            files.push(FileChange {
                path: PathBuf::from("crates/clawreform-kernel/src/lib.rs"),
                change_type: ChangeType::Modify,
                diff_preview: "// Module changes".to_string(),
                lines_added: 10,
                lines_removed: 0,
            });
        }
    }

    Ok(files)
}

fn estimate_complexity(files: &[FileChange]) -> u8 {
    let total_lines: usize = files.iter().map(|f| f.lines_added + f.lines_removed).sum();

    if total_lines < 50 {
        1
    } else if total_lines < 100 {
        3
    } else if total_lines < 200 {
        5
    } else if total_lines < 500 {
        7
    } else {
        9
    }
}

fn assess_risk(intent: &Intent, _files: &[FileChange]) -> RiskLevel {
    match intent.action {
        Action::AddConfig | Action::AddSkill => RiskLevel::Low,
        Action::AddEndpoint | Action::AddHand => RiskLevel::Medium,
        Action::AddFeature | Action::ModifyBehavior => RiskLevel::Medium,
        Action::Fix => RiskLevel::Medium,
        Action::Refactor => RiskLevel::High,
    }
}

fn generate_plan_id() -> String {
    format!("mod_{}", chrono::Utc::now().format("%Y%m%d_%H%M%S"))
}
