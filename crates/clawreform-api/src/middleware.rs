//! Production middleware for the ClawReform API server.
//!
//! Provides:
//! - Request ID generation and propagation
//! - Per-endpoint structured request logging
//! - In-memory rate limiting (per IP)

use axum::body::Body;
use axum::http::{Method, Request, Response, StatusCode};
use axum::middleware::Next;
use std::time::Instant;
use tracing::info;

/// Request ID header name (standard).
pub const REQUEST_ID_HEADER: &str = "x-request-id";

/// Middleware: inject a unique request ID and log the request/response.
pub async fn request_logging(request: Request<Body>, next: Next) -> Response<Body> {
    let request_id = uuid::Uuid::new_v4().to_string();
    let method = request.method().clone();
    let uri = request.uri().path().to_string();
    let start = Instant::now();

    let mut response = next.run(request).await;

    let elapsed = start.elapsed();
    let status = response.status().as_u16();

    info!(
        request_id = %request_id,
        method = %method,
        path = %uri,
        status = status,
        latency_ms = elapsed.as_millis() as u64,
        "API request"
    );

    // Inject the request ID into the response
    if let Ok(header_val) = request_id.parse() {
        response.headers_mut().insert(REQUEST_ID_HEADER, header_val);
    }

    response
}

fn is_loopback_request<B>(request: &Request<B>) -> bool {
    request
        .extensions()
        .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
        .map(|ci| ci.0.ip().is_loopback())
        .unwrap_or(false)
}

fn is_public_dashboard_path(path: &str) -> bool {
    path == "/"
        || path == "/api/health"
        || path == "/api/health/detail"
        || path == "/api/status"
        || path == "/api/version"
        || path == "/api/agents"
        || path == "/api/profiles"
        || path == "/api/config"
        || path.starts_with("/api/uploads/")
        || path == "/api/models"
        || path == "/api/models/aliases"
        || path == "/api/providers"
        || path == "/api/budget"
        || path == "/api/budget/agents"
        || path.starts_with("/api/budget/agents/")
        || path == "/api/network/status"
        || path == "/api/a2a/agents"
        || path == "/api/approvals"
        || path == "/api/channels"
        || path == "/api/skills"
        || path == "/api/sessions"
        || path == "/api/integrations"
        || path == "/api/integrations/available"
        || path == "/api/integrations/health"
        || path.starts_with("/api/cron/")
}

fn is_local_obsidian_bootstrap_request<B>(request: &Request<B>) -> bool {
    if !is_loopback_request(request) {
        return false;
    }

    let path = request.uri().path();
    let method = request.method();

    if method == Method::POST && path == "/api/agents" {
        return true;
    }

    let Some(suffix) = path.strip_prefix("/api/agents/") else {
        return false;
    };
    let Some((_agent_id, rest)) = suffix.split_once('/') else {
        return false;
    };

    (method == Method::GET && rest == "files")
        || ((method == Method::GET || method == Method::PUT) && rest.starts_with("files/"))
}

/// Bearer token authentication middleware.
///
/// When `api_key` is non-empty, all requests must include
/// `Authorization: Bearer <api_key>`. If the key is empty, auth is bypassed.
pub async fn auth(
    axum::extract::State(api_key): axum::extract::State<String>,
    request: Request<Body>,
    next: Next,
) -> Response<Body> {
    // If no API key configured, restrict to loopback addresses only.
    if api_key.is_empty() {
        if !is_loopback_request(&request) {
            tracing::warn!(
                "Rejected non-localhost request: no API key configured. \
                 Set api_key in config.toml for remote access."
            );
            return Response::builder()
                .status(StatusCode::FORBIDDEN)
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::json!({
                        "error": "No API key configured. Remote access denied. Configure api_key in ~/.clawreform/config.toml"
                    })
                    .to_string(),
                ))
                .unwrap_or_default();
        }
        return next.run(request).await;
    }

    // Public endpoints that don't require auth (dashboard needs these).
    // Obsidian bootstrap also gets a silent loopback-only bypass so the local
    // dashboard can seed and sync memory files without forcing an auth prompt.
    let path = request.uri().path();
    if is_public_dashboard_path(path) || is_local_obsidian_bootstrap_request(&request) {
        return next.run(request).await;
    }

    // Check Authorization: Bearer <token> header
    let bearer_token = request
        .headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    // SECURITY: Use constant-time comparison to prevent timing attacks.
    let header_auth = bearer_token.map(|token| {
        use subtle::ConstantTimeEq;
        if token.len() != api_key.len() {
            return false;
        }
        token.as_bytes().ct_eq(api_key.as_bytes()).into()
    });

    // Also check ?token= query parameter (for EventSource/SSE clients that
    // cannot set custom headers, same approach as WebSocket auth).
    let query_token = request
        .uri()
        .query()
        .and_then(|q| q.split('&').find_map(|pair| pair.strip_prefix("token=")));

    // SECURITY: Use constant-time comparison to prevent timing attacks.
    let query_auth = query_token.map(|token| {
        use subtle::ConstantTimeEq;
        if token.len() != api_key.len() {
            return false;
        }
        token.as_bytes().ct_eq(api_key.as_bytes()).into()
    });

    // Accept if either auth method matches
    if header_auth == Some(true) || query_auth == Some(true) {
        return next.run(request).await;
    }

    // Determine error message: was a credential provided but wrong, or missing entirely?
    let credential_provided = header_auth.is_some() || query_auth.is_some();
    let error_msg = if credential_provided {
        "Invalid API key"
    } else {
        "Missing Authorization: Bearer <api_key> header"
    };

    Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .header("www-authenticate", "Bearer")
        .body(Body::from(
            serde_json::json!({"error": error_msg}).to_string(),
        ))
        .unwrap_or_default()
}

/// Security headers middleware — applied to ALL API responses.
pub async fn security_headers(request: Request<Body>, next: Next) -> Response<Body> {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert("x-content-type-options", "nosniff".parse().unwrap());
    headers.insert("x-frame-options", "DENY".parse().unwrap());
    headers.insert("x-xss-protection", "1; mode=block".parse().unwrap());
    // All JS/CSS is bundled inline — only external resource is Google Fonts.
    headers.insert(
        "content-security-policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:*; font-src 'self' https://fonts.gstatic.com; media-src 'self' blob:; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'"
            .parse()
            .unwrap(),
    );
    headers.insert(
        "referrer-policy",
        "strict-origin-when-cross-origin".parse().unwrap(),
    );
    headers.insert(
        "cache-control",
        "no-store, no-cache, must-revalidate".parse().unwrap(),
    );
    response
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::extract::ConnectInfo;
    use std::net::{IpAddr, Ipv4Addr, SocketAddr};

    fn request_with_addr(method: Method, path: &str, ip: IpAddr) -> Request<Body> {
        let mut request = Request::builder()
            .method(method)
            .uri(path)
            .body(Body::empty())
            .unwrap();
        request
            .extensions_mut()
            .insert(ConnectInfo(SocketAddr::new(ip, 12345)));
        request
    }

    #[test]
    fn test_request_id_header_constant() {
        assert_eq!(REQUEST_ID_HEADER, "x-request-id");
    }

    #[test]
    fn test_local_obsidian_bootstrap_routes_are_allowed() {
        let loopback = IpAddr::V4(Ipv4Addr::LOCALHOST);
        assert!(is_local_obsidian_bootstrap_request(&request_with_addr(
            Method::POST,
            "/api/agents",
            loopback,
        )));
        assert!(is_local_obsidian_bootstrap_request(&request_with_addr(
            Method::GET,
            "/api/agents/test-agent/files",
            loopback,
        )));
        assert!(is_local_obsidian_bootstrap_request(&request_with_addr(
            Method::PUT,
            "/api/agents/test-agent/files/CORE.md",
            loopback,
        )));
    }

    #[test]
    fn test_obsidian_bypass_does_not_apply_to_remote_or_unrelated_routes() {
        let remote = IpAddr::V4(Ipv4Addr::new(10, 0, 0, 9));
        assert!(!is_local_obsidian_bootstrap_request(&request_with_addr(
            Method::POST,
            "/api/agents",
            remote,
        )));
        assert!(!is_local_obsidian_bootstrap_request(&request_with_addr(
            Method::DELETE,
            "/api/agents/test-agent",
            IpAddr::V4(Ipv4Addr::LOCALHOST),
        )));
        assert!(!is_local_obsidian_bootstrap_request(&request_with_addr(
            Method::POST,
            "/api/agents/test-agent/message",
            IpAddr::V4(Ipv4Addr::LOCALHOST),
        )));
    }
}
