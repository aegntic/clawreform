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

/// OpenClaw service endpoints
const OPENCLAW_REGISTRY: &str = "http://localhost:8001";
const OPENCLAW_DISPATCHER: &str = "http://localhost:8002";
const OPENCLAW_SCHEDULER: &str = "http://localhost:8003";
const OPENCLAW_EVALUATOR: &str = "http://localhost:8004";
const OPENCLAW_REPAIR: &str = "http://localhost:8005";

lazy_static::lazy_static! {
    static ref HTTP_CLIENT: Client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .expect("Failed to create HTTP client");
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
    let mut services = HashMap::new();

    // Check each service
    let service_urls = [
        ("registry", OPENCLAW_REGISTRY),
        ("dispatcher", OPENCLAW_DISPATCHER),
        ("scheduler", OPENCLAW_SCHEDULER),
        ("evaluator", OPENCLAW_EVALUATOR),
        ("repair", OPENCLAW_REPAIR),
    ];

    for (name, url) in service_urls {
        let healthy = HTTP_CLIENT
            .get(format!("{}/health", url))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false);

        services.insert(
            name.to_string(),
            ServiceStatus {
                healthy,
                url: url.to_string(),
            },
        );
    }

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
    let url = format!("{}/agents", OPENCLAW_REGISTRY);
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
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

/// POST /api/openclaw/agents - Register a new agent
pub async fn register_agent(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let url = format!("{}/agents", OPENCLAW_REGISTRY);

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

/// GET /api/openclaw/agents/{id} - Get agent by ID
pub async fn get_registered_agent(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = format!("{}/agents/{}", OPENCLAW_REGISTRY, id);

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
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
    let url = format!("{}/dispatch", OPENCLAW_DISPATCHER);

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

/// GET /api/openclaw/routes - Get routing rules
pub async fn get_routes(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    let url = format!("{}/routes", OPENCLAW_DISPATCHER);

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

// ============================================================================
// Scheduler API (port 8003)
// ============================================================================

/// GET /api/openclaw/schedules - List schedules
pub async fn list_schedules(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    let url = format!("{}/schedules", OPENCLAW_SCHEDULER);

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

/// POST /api/openclaw/schedules - Create a schedule
pub async fn create_schedule(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let url = format!("{}/schedules", OPENCLAW_SCHEDULER);

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

/// POST /api/openclaw/schedules/{id}/trigger - Trigger a schedule manually
pub async fn trigger_schedule(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = format!("{}/schedules/{}/trigger", OPENCLAW_SCHEDULER, id);

    match HTTP_CLIENT.post(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
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
    let url = format!("{}/evaluate", OPENCLAW_EVALUATOR);

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
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
    let url = format!("{}/repair", OPENCLAW_REPAIR);

    match HTTP_CLIENT.post(&url).json(&body).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

/// GET /api/openclaw/repair/{id} - Get repair status
pub async fn get_repair_status(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = format!("{}/repair/{}", OPENCLAW_REPAIR, id);

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

/// POST /api/openclaw/repair/{id}/execute - Execute a repair
pub async fn execute_repair(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = format!("{}/repair/{}/execute", OPENCLAW_REPAIR, id);

    match HTTP_CLIENT.post(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}

/// GET /api/openclaw/strategies - Get repair strategies
pub async fn get_repair_strategies(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
    let url = format!("{}/strategies", OPENCLAW_REPAIR);

    match HTTP_CLIENT.get(&url).send().await {
        Ok(resp) => {
            let status = resp.status();
            match resp.text().await {
                Ok(body) => (status, body),
                Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
            }
        }
        Err(e) => (StatusCode::BAD_GATEWAY, format!("{{\"error\": \"{}\"}}", e)),
    }
}
