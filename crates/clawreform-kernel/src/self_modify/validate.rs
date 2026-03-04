//! Validation — runs build, test, and clippy to verify changes

use super::types::*;
use std::path::Path;
use std::process::Command;
use tracing::{info, warn};

/// Run full validation on the codebase
pub async fn run_validation(source_dir: &Path) -> Result<ValidationResult, ModifyError> {
    info!("Running validation in {:?}", source_dir);

    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // 1. Build
    let build_passed = run_build(source_dir, &mut errors).await;

    // 2. Tests (only if build passed)
    let tests_passed = if build_passed {
        run_tests(source_dir, &mut errors).await
    } else {
        false
    };

    // 3. Clippy (only if build passed)
    let clippy_passed = if build_passed {
        run_clippy(source_dir, &mut warnings).await
    } else {
        false
    };

    let success = build_passed && tests_passed;

    Ok(ValidationResult {
        success,
        build_passed,
        tests_passed,
        clippy_passed,
        errors,
        warnings,
    })
}

async fn run_build(source_dir: &Path, errors: &mut Vec<String>) -> bool {
    info!("Running cargo build");

    let output = Command::new("cargo")
        .args(["build", "--workspace", "--lib"])
        .current_dir(source_dir)
        .output();

    match output {
        Ok(output) if output.status.success() => {
            info!("Build passed");
            true
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            errors.push(format!("Build failed: {}", stderr));
            warn!("Build failed: {}", stderr);
            false
        }
        Err(e) => {
            errors.push(format!("Failed to run build: {}", e));
            false
        }
    }
}

async fn run_tests(source_dir: &Path, errors: &mut Vec<String>) -> bool {
    info!("Running cargo test");

    let output = Command::new("cargo")
        .args(["test", "--workspace"])
        .current_dir(source_dir)
        .output();

    match output {
        Ok(output) if output.status.success() => {
            info!("Tests passed");
            true
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            errors.push(format!("Tests failed: {}", stderr));
            warn!("Tests failed: {}", stderr);
            false
        }
        Err(e) => {
            errors.push(format!("Failed to run tests: {}", e));
            false
        }
    }
}

async fn run_clippy(source_dir: &Path, warnings: &mut Vec<String>) -> bool {
    info!("Running cargo clippy");

    let output = Command::new("cargo")
        .args([
            "clippy",
            "--workspace",
            "--all-targets",
            "--",
            "-D",
            "warnings",
        ])
        .current_dir(source_dir)
        .output();

    match output {
        Ok(output) if output.status.success() => {
            info!("Clippy passed");
            true
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            warnings.push(format!("Clippy warnings: {}", stderr));
            warn!("Clippy failed: {}", stderr);
            false
        }
        Err(e) => {
            warnings.push(format!("Failed to run clippy: {}", e));
            false
        }
    }
}
