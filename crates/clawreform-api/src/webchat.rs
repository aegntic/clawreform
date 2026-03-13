//! Embedded WebChat UI served as static HTML.
//!
//! The production dashboard is assembled at compile time from separate
//! HTML/CSS/JS files under `static/` using `include_str!()`. This keeps
//! single-binary deployment while allowing organized source files.
//!
//! Features:
//! - Alpine.js SPA with hash-based routing across dashboard panels
//! - Dark/light theme toggle with system preference detection
//! - Responsive layout with collapsible sidebar
//! - Markdown rendering + syntax highlighting (bundled locally)
//! - WebSocket real-time chat with HTTP fallback
//! - Agent management, workflows, memory browser, audit log, and more

use axum::extract::Path;
use axum::http::header;
use axum::response::IntoResponse;

/// Compile-time ETag based on the crate version.
const ETAG: &str = concat!("\"clawreform-", env!("CARGO_PKG_VERSION"), "\"");

/// Embedded logo PNG for single-binary deployment.
const LOGO_PNG: &[u8] = include_bytes!("../static/logo.png");

/// Embedded favicon ICO for browser tabs.
const FAVICON_ICO: &[u8] = include_bytes!("../static/favicon.ico");

/// Embedded top-rail branding strip used by the shell chrome.
const BRANDING_SHELL_RAIL_STRIP_CLEAN_PNG: &[u8] =
    include_bytes!("../static/branding/shell-rail-strip-clean.png");
const BRANDING_SHELL_RAIL_ELBOW_CLEAN_PNG: &[u8] =
    include_bytes!("../static/branding/shell-rail-elbow-clean.png");
const BRANDING_SHELL_RAILS_REF_PNG: &[u8] =
    include_bytes!("../static/branding/shell-rails-ref.png");
const BRANDING_SHELL_RAIL_STRIP_TRANSPARENT_PNG: &[u8] =
    include_bytes!("../static/branding/shell-rail-strip-transparent.png");
const BRANDING_SHELL_RAIL_ELBOW_TRANSPARENT_PNG: &[u8] =
    include_bytes!("../static/branding/shell-rail-elbow-transparent.png");

/// GET /logo.png — Serve the ClawReform logo.
pub async fn logo_png() -> impl IntoResponse {
    (
        [
            (header::CONTENT_TYPE, "image/png"),
            (header::CACHE_CONTROL, "public, max-age=86400, immutable"),
        ],
        LOGO_PNG,
    )
}

/// GET /favicon.ico — Serve the ClawReform favicon.
pub async fn favicon_ico() -> impl IntoResponse {
    (
        [
            (header::CONTENT_TYPE, "image/x-icon"),
            (header::CACHE_CONTROL, "public, max-age=86400, immutable"),
        ],
        FAVICON_ICO,
    )
}

/// GET /branding/{*path} — Serve embedded branding assets used by the dashboard chrome.
pub async fn branding_asset(Path(path): Path<String>) -> impl IntoResponse {
    match path.as_str() {
        "shell-rail-strip-transparent.png" => (
            [
                (header::CONTENT_TYPE, "image/png"),
                (header::CACHE_CONTROL, "public, max-age=86400, immutable"),
            ],
            BRANDING_SHELL_RAIL_STRIP_TRANSPARENT_PNG,
        )
            .into_response(),
        "shell-rail-elbow-transparent.png" => (
            [
                (header::CONTENT_TYPE, "image/png"),
                (header::CACHE_CONTROL, "public, max-age=86400, immutable"),
            ],
            BRANDING_SHELL_RAIL_ELBOW_TRANSPARENT_PNG,
        )
            .into_response(),
        "shell-rail-elbow-clean.png" => (
            [
                (header::CONTENT_TYPE, "image/png"),
                (header::CACHE_CONTROL, "public, max-age=86400, immutable"),
            ],
            BRANDING_SHELL_RAIL_ELBOW_CLEAN_PNG,
        )
            .into_response(),
        "shell-rails-ref.png" => (
            [
                (header::CONTENT_TYPE, "image/png"),
                (header::CACHE_CONTROL, "public, max-age=86400, immutable"),
            ],
            BRANDING_SHELL_RAILS_REF_PNG,
        )
            .into_response(),
        "shell-rail-strip-clean.png" => (
            [
                (header::CONTENT_TYPE, "image/png"),
                (header::CACHE_CONTROL, "public, max-age=86400, immutable"),
            ],
            BRANDING_SHELL_RAIL_STRIP_CLEAN_PNG,
        )
            .into_response(),
        _ => (
            axum::http::StatusCode::NOT_FOUND,
            "branding asset not found",
        )
            .into_response(),
    }
}

/// GET / — Serve the clawREFORM by aegntic.ai Dashboard single-page application.
///
/// Returns the full SPA with ETag header based on package version for caching.
pub async fn webchat_page() -> impl IntoResponse {
    (
        [
            (header::CONTENT_TYPE, "text/html; charset=utf-8"),
            (header::ETAG, ETAG),
            (
                header::CACHE_CONTROL,
                "public, max-age=3600, must-revalidate",
            ),
        ],
        WEBCHAT_HTML,
    )
}

/// The embedded HTML/CSS/JS for the clawREFORM by aegntic.ai Dashboard.
///
/// Assembled at compile time from organized static files.
/// All vendor libraries (Alpine.js, marked.js, highlight.js) are bundled
/// locally — no CDN dependency. Alpine.js is included LAST because it
/// immediately processes x-data directives and fires alpine:init on load.
const WEBCHAT_HTML: &str = concat!(
    include_str!("../static/index_head.html"),
    "<style>\n",
    include_str!("../static/css/theme.css"),
    "\n",
    include_str!("../static/css/layout.css"),
    "\n",
    include_str!("../static/css/components.css"),
    "\n",
    include_str!("../static/vendor/github-dark.min.css"),
    "\n</style>\n",
    include_str!("../static/index_body.html"),
    // Vendor libs: marked + highlight first (used by app.js)
    "<script>\n",
    include_str!("../static/vendor/marked.min.js"),
    "\n</script>\n",
    "<script>\n",
    include_str!("../static/vendor/highlight.min.js"),
    "\n</script>\n",
    // App code
    "<script>\n",
    include_str!("../static/js/api.js"),
    "\n",
    include_str!("../static/js/app.js"),
    "\n",
    include_str!("../static/js/pages/overview.js"),
    "\n",
    include_str!("../static/js/pages/chat.js"),
    "\n",
    include_str!("../static/js/pages/agents.js"),
    "\n",
    include_str!("../static/js/pages/workflows.js"),
    "\n",
    include_str!("../static/js/pages/workflow-builder.js"),
    "\n",
    include_str!("../static/js/pages/channels.js"),
    "\n",
    include_str!("../static/js/pages/skills.js"),
    "\n",
    include_str!("../static/js/pages/hands.js"),
    "\n",
    include_str!("../static/js/pages/scheduler.js"),
    "\n",
    include_str!("../static/js/pages/settings.js"),
    "\n",
    include_str!("../static/js/pages/usage.js"),
    "\n",
    include_str!("../static/js/pages/sessions.js"),
    "\n",
    include_str!("../static/js/pages/memory-layers.js"),
    "\n",
    include_str!("../static/js/pages/collective.js"),
    "\n",
    include_str!("../static/js/pages/agentdna.js"),
    "\n",
    include_str!("../static/js/pages/company.js"),
    "\n",
    include_str!("../static/js/pages/logs.js"),
    "\n",
    include_str!("../static/js/pages/wizard.js"),
    "\n",
    include_str!("../static/js/pages/model-selector.js"),
    "\n",
    include_str!("../static/js/pages/import.js"),
    "\n",
    include_str!("../static/js/pages/approvals.js"),
    "\n</script>\n",
    // Alpine.js MUST be last — it processes x-data and fires alpine:init
    "<script>\n",
    include_str!("../static/vendor/alpine.min.js"),
    "\n</script>\n",
    "</body></html>"
);
