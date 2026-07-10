//! Scoped file system — path-sandboxed file access per agent.
//!
//! Each agent operates within a restricted file scope to prevent
//! unauthorized access to files outside its designated area.

use crate::error::{TeamError, TeamResult};
use crate::types::FileScope;
use std::path::{Path, PathBuf};

/// Scoped file system that enforces path restrictions.
#[derive(Debug, Clone)]
pub struct ScopedFileSystem {
    scope: FileScope,
}

impl ScopedFileSystem {
    /// Create a new scoped file system with the given scope.
    pub fn new(scope: FileScope) -> Self {
        Self { scope }
    }

    /// Create with just a base directory (full access within it).
    pub fn with_base(base_dir: PathBuf) -> Self {
        Self {
            scope: FileScope {
                base_dir,
                allowed: vec!["**".to_string()],
                denied: Vec::new(),
            },
        }
    }

    /// Resolve and validate a path within the agent's scope.
    ///
    /// Returns the absolute path (canonicalized if it exists) if the path is allowed.
    pub fn resolve_path(&self, path: &str) -> TeamResult<PathBuf> {
        let requested = if Path::new(path).is_absolute() {
            PathBuf::from(path)
        } else if self.scope.base_dir.as_os_str().is_empty() {
            std::env::current_dir()?.join(path)
        } else {
            self.scope.base_dir.join(path)
        };

        // Extract strings before moving `requested` into canonicalize
        let requested_str = requested.to_string_lossy().to_string();
        let file_name = requested
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        // Canonicalize: if the path exists, use canonicalize directly.
        // If it doesn't exist, canonicalize the parent and append the filename.
        let canonical = if requested.exists() {
            requested
                .canonicalize()
                .map_err(|e| TeamError::FileScope(format!("Cannot resolve path '{path}': {e}")))?
        } else if let Some(parent) = requested.parent() {
            let canonical_parent = if parent.exists() {
                parent
                    .canonicalize()
                    .map_err(|e| TeamError::FileScope(format!("Cannot resolve path '{path}': {e}")))?
            } else {
                parent.to_path_buf()
            };
            if let Some(name) = requested.file_name() {
                canonical_parent.join(name)
            } else {
                canonical_parent
            }
        } else {
            requested
        };

        // Check base directory constraint
        if !self.scope.base_dir.as_os_str().is_empty() {
            let base = if self.scope.base_dir.exists() {
                self.scope.base_dir.canonicalize().map_err(|e| {
                    TeamError::FileScope(format!("Base directory error: {e}"))
                })?
            } else {
                self.scope.base_dir.clone()
            };
            let canonical_str = canonical.to_string_lossy();
            let base_str = base.to_string_lossy();
            if !canonical_str.starts_with(&*base_str) {
                return Err(TeamError::FileScope(format!(
                    "Path '{path}' escapes base directory '{:?}'",
                    self.scope.base_dir
                )));
            }
        }

        // Check denied patterns (match against filename, requested path, and canonical path)
        for pattern in &self.scope.denied {
            if Self::matches_glob_str(&file_name, pattern)
                || Self::matches_glob_str(&requested_str, pattern)
                || Self::matches_glob_path(&canonical, pattern)
            {
                return Err(TeamError::FileScope(format!(
                    "Path '{path}' matches denied pattern '{pattern}'"
                )));
            }
        }

        // Check allowed patterns (if any specified)
        if !self.scope.allowed.is_empty() {
            let allowed = self.scope.allowed.iter().any(|pattern| {
                Self::matches_glob_str(&file_name, pattern)
                    || Self::matches_glob_str(&requested_str, pattern)
                    || Self::matches_glob_path(&canonical, pattern)
            });
            if !allowed {
                return Err(TeamError::FileScope(format!(
                    "Path '{path}' does not match any allowed pattern"
                )));
            }
        }

        Ok(canonical)
    }

    /// Read a file within scope.
    pub fn read_file(&self, path: &str) -> TeamResult<String> {
        let resolved = self.resolve_path(path)?;
        std::fs::read_to_string(&resolved)
            .map_err(|e| TeamError::FileScope(format!("Cannot read '{path}': {e}")))
    }

    /// Read a file as bytes within scope.
    pub fn read_bytes(&self, path: &str) -> TeamResult<Vec<u8>> {
        let resolved = self.resolve_path(path)?;
        std::fs::read(&resolved)
            .map_err(|e| TeamError::FileScope(format!("Cannot read '{path}': {e}")))
    }

    /// Write a file within scope.
    pub fn write_file(&self, path: &str, content: &str) -> TeamResult<()> {
        let resolved = self.resolve_path(path)?;
        if let Some(parent) = resolved.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(&resolved, content)
            .map_err(|e| TeamError::FileScope(format!("Cannot write '{path}': {e}")))
    }

    /// Write bytes to a file within scope.
    pub fn write_bytes(&self, path: &str, content: &[u8]) -> TeamResult<()> {
        let resolved = self.resolve_path(path)?;
        if let Some(parent) = resolved.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(&resolved, content)
            .map_err(|e| TeamError::FileScope(format!("Cannot write '{path}': {e}")))
    }

    /// Check if a file exists within scope.
    pub fn exists(&self, path: &str) -> bool {
        if let Ok(resolved) = self.resolve_path(path) {
            resolved.exists()
        } else {
            false
        }
    }

    /// Delete a file within scope.
    pub fn delete_file(&self, path: &str) -> TeamResult<()> {
        let resolved = self.resolve_path(path)?;
        std::fs::remove_file(&resolved)
            .map_err(|e| TeamError::FileScope(format!("Cannot delete '{path}': {e}")))
    }

    /// List files in a directory within scope.
    pub fn list_dir(&self, path: &str) -> TeamResult<Vec<String>> {
        let resolved = self.resolve_path(path)?;
        let mut entries = Vec::new();
        for entry in std::fs::read_dir(&resolved)
            .map_err(|e| TeamError::FileScope(format!("Cannot list '{path}': {e}")))?
        {
            let entry = entry?;
            entries.push(entry.file_name().to_string_lossy().to_string());
        }
        Ok(entries)
    }

    /// Get the base directory.
    pub fn base_dir(&self) -> &Path {
        &self.scope.base_dir
    }

    /// Get the file scope.
    pub fn scope(&self) -> &FileScope {
        &self.scope
    }

    /// Simple glob matching against a Path.
    fn matches_glob_path(path: &Path, pattern: &str) -> bool {
        Self::matches_glob_str(&path.to_string_lossy(), pattern)
    }

    /// Simple glob matching against a string.
    /// Supports `*` (any chars except /) and `**` (any chars including /).
    fn matches_glob_str(text: &str, pattern: &str) -> bool {
        let regex_str = glob_to_regex(pattern);
        if let Ok(re) = regex_lite::Regex::new(&regex_str) {
            re.is_match(text)
        } else {
            false
        }
    }
}

/// Convert a glob pattern to a regex pattern.
fn glob_to_regex(glob: &str) -> String {
    let mut regex = String::with_capacity(glob.len() * 2);
    let mut chars = glob.chars().peekable();

    while let Some(c) = chars.next() {
        match c {
            '*' => {
                if chars.peek() == Some(&'*') {
                    chars.next();
                    regex.push_str(".*");
                } else {
                    regex.push_str("[^/]*");
                }
            }
            '?' => regex.push_str("[^/]"),
            '.' | '+' | '(' | ')' | '[' | ']' | '{' | '}' | '^' | '$' | '|' | '\\' => {
                regex.push('\\');
                regex.push(c);
            }
            _ => regex.push(c),
        }
    }

    format!("^{}$", regex)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_glob_to_regex() {
        assert_eq!(glob_to_regex("**"), "^.*$");
        assert_eq!(glob_to_regex("*.rs"), "^[^/]*\\.rs$");
        assert_eq!(glob_to_regex("src/**/*.rs"), "^src/.*/[^/]*\\.rs$");
    }

    #[tokio::test]
    async fn test_with_base() {
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        fs.write_file("test.txt", "hello").unwrap();
        assert_eq!(fs.read_file("test.txt").unwrap(), "hello");
        assert!(fs.exists("test.txt"));
        assert_eq!(fs.list_dir(".").unwrap().len(), 1);
    }

    #[tokio::test]
    async fn test_escape_base() {
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        // Try to read outside the base directory
        let result = fs.read_file("../../etc/passwd");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_write_subdirs() {
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        fs.write_file("a/b/c.txt", "nested").unwrap();
        assert_eq!(fs.read_file("a/b/c.txt").unwrap(), "nested");
    }

    #[tokio::test]
    async fn test_delete() {
        let dir = tempfile::tempdir().unwrap();
        let fs = ScopedFileSystem::with_base(dir.path().to_path_buf());

        fs.write_file("del.txt", "gone").unwrap();
        assert!(fs.exists("del.txt"));
        fs.delete_file("del.txt").unwrap();
        assert!(!fs.exists("del.txt"));
    }

    #[tokio::test]
    async fn test_denied_patterns() {
        let dir = tempfile::tempdir().unwrap();
        let scope = FileScope {
            base_dir: dir.path().to_path_buf(),
            allowed: vec!["**".to_string()],
            denied: vec!["*.secret".to_string()],
        };
        let fs = ScopedFileSystem::new(scope);

        fs.write_file("public.txt", "ok").unwrap();
        let result = fs.write_file("data.secret", "forbidden");
        assert!(result.is_err());
    }
}
