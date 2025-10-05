ChainSleuth — Crypto Due Diligence Agent (MVP)

What’s included (Week 0 skeleton)

- backend/ (Rust, Axum):
  - POST /report { project_name } → { run_id }
  - GET /report/:id → JSON (status, progress, markdown, facts)
  - GET /report/:id/stream (SSE) — optional streaming progress
  - Mocked end-to-end with static data
- frontend/ (Next.js App Router):
  - / (search) → submit → navigate to /dd/:id
  - /dd/:id displays progress and renders Markdown + facts grid
- docker-compose.yml: Backend, Frontend, (Postgres placeholder)
- Makefile: dev helpers

Quickstart

1) Backend (Rust):
   - cd backend
   - cargo run
   - Health check: curl http://127.0.0.1:8081/healthz
2) Frontend (Node 20+):
   - cd frontend && npm install
   - npm run dev
   - Open http://localhost:3000
3) Docker (optional):
   - docker compose up --build

Notes

- Week 0 acceptance is mocked/static; Week 1+ will wire CoinGecko/DeFiLlama, normalization, and ONNX models.
- CORS is enabled for http://localhost:3000 by default; adjust via BACKEND_CORS_ORIGIN.

