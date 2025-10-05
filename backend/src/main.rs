use std::{collections::HashMap, net::SocketAddr, sync::Arc, time::Duration};

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::sse::{Event, KeepAlive, Sse},
    routing::{get, post},
    Json, Router,
};
use axum::http;
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, RwLock};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::EnvFilter;
use uuid::Uuid;

static DEFAULT_REPORT_MD: &str = r"# ChainSleuth Report: {project}

## Use Case
- Decentralized exchange for token swaps. [1]
- Liquidity pool-based AMM with governance. [2]

## Tokenomics
- Circulating/Max supply: 75% / 100% (est). FDV ratio: 1.33×. [1]

## TVL
- Current TVL: $4.2B. Trend: Up (30d). [3]

## Security
- Audits: Yes (2023-08, 2024-03). No major exploits found. [4]

## Market Position
- Among top DEXes by TVL; strong DeFiLlama profile. [3]

--
Sources: [1] CoinGecko, [2] Project Docs, [3] DeFiLlama, [4] Audit Reports
";

#[derive(Clone)]
struct AppState {
    runs: Arc<RwLock<HashMap<String, RunRecord>>>,
    tx: broadcast::Sender<RunEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RunRecord {
    id: String,
    project: String,
    status: String,      // queued|running|done|error
    progress: u8,        // 0..=100
    started_at: i64,     // epoch seconds
    finished_at: Option<i64>,
    markdown: Option<String>,
    facts: Option<serde_json::Value>,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RunEvent {
    id: String,
    progress: u8,
    status: String,
}

#[derive(Debug, Deserialize)]
struct CreateReportReq { project_name: String }

#[derive(Debug, Serialize)]
struct CreateReportResp { run_id: String }

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let (tx, _rx) = broadcast::channel(128);
    let state = AppState { runs: Default::default(), tx };

    let origin_hv: Option<http::HeaderValue> = std::env::var("BACKEND_CORS_ORIGIN").ok().and_then(|s| s.parse().ok());
    let cors = if let Some(hv) = origin_hv {
        CorsLayer::new().allow_methods(Any).allow_headers(Any).allow_origin(hv)
    } else {
        CorsLayer::new().allow_methods(Any).allow_headers(Any).allow_origin(Any)
    };

    let app = Router::new()
        .route("/healthz", get(|| async { "ok" }))
        .route("/report", post(create_report))
        .route("/report/:id", get(get_report))
        .route("/report/:id/stream", get(stream_report))
        .with_state(state)
        .layer(cors);

    let port: u16 = std::env::var("BACKEND_PORT").ok().and_then(|s| s.parse().ok()).unwrap_or(8081);
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    tracing::info!(%addr, "listening");
    axum::serve(tokio::net::TcpListener::bind(addr).await?, app).await?;
    Ok(())
}

async fn create_report(State(st): State<AppState>, Json(req): Json<CreateReportReq>) -> Result<Json<CreateReportResp>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let record = RunRecord {
        id: id.clone(),
        project: req.project_name.clone(),
        status: "queued".into(),
        progress: 0,
        started_at: now,
        finished_at: None,
        markdown: None,
        facts: None,
        error: None,
    };
    {
        let mut runs = st.runs.write().await;
        runs.insert(id.clone(), record);
    }
    // Spawn mock pipeline
    let st2 = st.clone();
    let id_for_task = id.clone();
    tokio::spawn(async move {
        let steps = [10, 35, 60, 80, 100];
        for (i, p) in steps.iter().enumerate() {
            tokio::time::sleep(Duration::from_millis(if i == 0 { 200 } else { 600 })).await;
            {
                let mut runs = st2.runs.write().await;
                if let Some(r) = runs.get_mut(&id_for_task) {
                    r.status = if *p < 100 { "running".into() } else { "done".into() };
                    r.progress = *p as u8;
                    if *p == 100 {
                        r.finished_at = Some(chrono::Utc::now().timestamp());
                        let md = DEFAULT_REPORT_MD.replace("{project}", &r.project);
                        r.markdown = Some(md);
                        r.facts = Some(serde_json::json!({
                            "project": r.project,
                            "tvl_usd": 4_200_000_000u64,
                            "audits": ["2023-08", "2024-03"],
                            "sources": ["coingecko", "defillama"],
                        }));
                    }
                }
            }
            let _ = st2.tx.send(RunEvent { id: id_for_task.clone(), progress: *p as u8, status: if *p < 100 { "running".into() } else { "done".into() } });
        }
    });

    Ok(Json(CreateReportResp { run_id: id }))
}

async fn get_report(State(st): State<AppState>, Path(id): Path<String>) -> Result<Json<RunRecord>, StatusCode> {
    let runs = st.runs.read().await;
    runs.get(&id).cloned().map(Json).ok_or(StatusCode::NOT_FOUND)
}

async fn stream_report(State(st): State<AppState>, Path(id): Path<String>) -> Sse<impl futures::Stream<Item = Result<Event, std::convert::Infallible>>> {
    use futures::{Stream, StreamExt};
    let mut rx = st.tx.subscribe();
    let stream = async_stream::stream! {
        loop {
            match rx.recv().await {
                Ok(ev) => {
                    if ev.id == id {
                        let txt = serde_json::to_string(&ev).unwrap();
                        yield Ok(Event::default().data(txt));
                    }
                }
                Err(_) => break,
            }
        }
    };
    Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(5)))
}
