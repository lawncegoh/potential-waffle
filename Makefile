.PHONY: be fe dev docker-up docker-down

be:
	cargo run --manifest-path backend/Cargo.toml

fe:
	cd frontend && npm install && npm run dev

dev:
	( cd backend && RUST_LOG=info cargo run ) & ( cd frontend && npm run dev )

docker-up:
	docker compose up --build

docker-down:
	docker compose down -v

