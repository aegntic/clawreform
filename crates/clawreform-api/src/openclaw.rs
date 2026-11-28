//! OpenClaw service integration routes.
//!
//! Proxies requests to OpenClaw Docker services (registry, dispatcher, scheduler, evaluator, repair).

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use reqwest::Client;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;

use super::routes::AppState;

/// Default OpenClaw service endpoints (overridable via `OPENCLAW_*_URL` env vars).
const DEFAULT_OPENCLAW_REGISTRY: &str = "http://localhost:8001";
const DEFAULT_OPENCLAW_DISPATCHER: &str = "http://localhost:8002";
const DEFAULT_OPENCLAW_SCHEDULER: &str = "http://localhost:8003";
const DEFAULT_OPENCLAW_EVALUATOR: &str = "http://localhost:8004";
const DEFAULT_OPENCLAW_REPAIR: &str = "http://localhost:8005";

fn service_url(env_var: &str, default: &str) -> String {
    std::env::var(env_var)
        .ok()
        .map(|v| v.trim().trim_end_matches('/').to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| default.to_string())
}

fn openclaw_registry_url() -> String {
    service_url("OPENCLAW_REGISTRY_URL", DEFAULT_OPENCLAW_REGISTRY)
}

fn openclaw_dispatcher_url() -> String {
    service_url("OPENCLAW_DISPATCHER_URL", DEFAULT_OPENCLAW_DISPATCHER)
}

fn openclaw_scheduler_url() -> String {
    service_url("OPENCLAW_SCHEDULER_URL", DEFAULT_OPENCLAW_SCHEDULER)
}

fn openclaw_evaluator_url() -> String {
    service_url("OPENCLAW_EVALUATOR_URL", DEFAULT_OPENCLAW_EVALUATOR)
}

fn openclaw_repair_url() -> String {
    service_url("OPENCLAW_REPAIR_URL", DEFAULT_OPENCLAW_REPAIR)
}

fn bad_gateway(err: impl std::fmt::Display) -> (StatusCode, String) {
    (
        StatusCode::BAD_GATEWAY,
        serde_json::json!({ "error": err.to_string() }).to_string(),
    )
}

lazy_static::lazy_static! {
    static ref HTTP_CLIENT: Client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .expect("Failed to create HTTP client");

    static ref HEALTH_CLIENT: Client = Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .expect("Failed to create OpenClaw health client");
}

// ============================================================================
// OpenClaw Status
// ============================================================================

#[derive(Serialize)]
pub struct OpenClawStatus {
    pub status: String,
    pub services: HashMap<String, ServiceStatus>,
    pub website: String,
}

#[derive(Serialize)]
pub struct ServiceStatus {
    pub healthy: bool,
    pub url: String,
}

/// GET /api/openclaw/status - Get status of all OpenClaw services
pub async fn get_status(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    let service_urls = [
        ("registry", openclaw_registry_url()),
        ("dispatcher", openclaw_dispatcher_url()),
        ("scheduler", openclaw_scheduler_url()),
        ("evaluator", openclaw_evaluator_url()),
        ("repair", openclaw_repair_url()),
    ];

    let checks = service_urls.into_iter().map(|(name, url)| async move {
        let healthy = HEALTH_CLIENT
            .get(format!("{url}/health"))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false);
        (name.to_string(), ServiceStatus { healthy, url })
    });

    let services: HashMap<String, ServiceStatus> = futures::future::join_all(checks)
        .await
        .into_iter()
        .collect();

    let all_healthy = services.values().all(|s| s.healthy);

    Json(OpenClawStatus {
        status: if all_healthy { "healthy" } else { "degraded" }.to_string(),
        services,
        website: "https://clawreform.com".to_string(),
    })
}

// ============================================================================
// Registry API (port 8001)
// ============================================================================

/// GET /api/openclaw/agents - List registered agents
pub async fn list_registered_agents(
    State(_state): State<Arc<AppState>>,
    Query(params): Query<HashMap<String, String>>,
) -> impl IntoResponse {
    let url = format!("{}/agents", openclaw_registry_url());
    let mut req = HTTP_CLIENT.get(&url);

    if let Some(kind) = params.get("kind") {
        req = req.query(&[("kind", kind)]);
    }
    if let Some(status) = params.get("status") {
        req = req.query(&[("status", status)]);
    }

    match req.send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

/// POST /api/openclaw/agents - Register a new agent
pub async fn register_agent(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let url = format!("{}/agents", openclaw_registry_url());

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

/// GET /api/openclaw/agents/{id} - Get agent by ID
pub async fn get_registered_agent(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = format!("{}/agents/{}", openclaw_registry_url(), id);

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

// ============================================================================
// Dispatcher API (port 8002)
// ============================================================================

/// POST /api/openclaw/dispatch - Dispatch a task
pub async fn dispatch_task(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let url = format!("{}/dispatch", openclaw_dispatcher_url());

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

/// GET /api/openclaw/routes - Get routing rules
pub async fn get_routes(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    let url = format!("{}/routes", openclaw_dispatcher_url());

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

// ============================================================================
// Scheduler API (port 8003)
// ============================================================================

/// GET /api/openclaw/schedules - List schedules
pub async fn list_schedules(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    let url = format!("{}/schedules", openclaw_scheduler_url());

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

/// POST /api/openclaw/schedules - Create a schedule
pub async fn create_schedule(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let url = format!("{}/schedules", openclaw_scheduler_url());

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

/// POST /api/openclaw/schedules/{id}/trigger - Trigger a schedule manually
pub async fn trigger_schedule(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = format!("{}/schedules/{}/trigger", openclaw_scheduler_url(), id);

    match HTTP_CLIENT.post(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

// ============================================================================
// Evaluator API (port 8004)
// ============================================================================

/// POST /api/openclaw/evaluate - Evaluate an artifact
pub async fn evaluate_artifact(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let url = format!("{}/evaluate", openclaw_evaluator_url());

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

// ============================================================================
// Repair API (port 8005)
// ============================================================================

/// POST /api/openclaw/repair - Request artifact repair
pub async fn request_repair(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let url = format!("{}/repair", openclaw_repair_url());

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

/// GET /api/openclaw/repair/{id} - Get repair status
pub async fn get_repair_status(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = format!("{}/repair/{}", openclaw_repair_url(), id);

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

/// POST /api/openclaw/repair/{id}/execute - Execute a repair
pub async fn execute_repair(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = format!("{}/repair/{}/execute", openclaw_repair_url(), id);

    match HTTP_CLIENT.post(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}

/// GET /api/openclaw/strategies - Get repair strategies
pub async fn get_repair_strategies(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    let url = format!("{}/strategies", openclaw_repair_url());

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => bad_gateway(e),
            }
        }
        Err(e) => bad_gateway(e),
    }
}
