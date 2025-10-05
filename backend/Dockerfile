FROM rust:1-bookworm AS builder
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
ENV BACKEND_PORT=8081
WORKDIR /app
COPY --from=builder /app/target/release/chainsleuth-backend /usr/local/bin/chainsleuth-backend
EXPOSE 8081
CMD ["/usr/local/bin/chainsleuth-backend"]

