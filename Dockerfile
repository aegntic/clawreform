# syntax=docker/dockerfile:1
FROM rust:1-slim-bookworm AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
COPY xtask ./xtask
COPY agents ./agents
COPY packages ./packages
RUN cargo build --release --bin clawreform

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /build/target/release/clawreform /usr/local/bin/
COPY --from=builder /build/agents /opt/clawreform/agents
EXPOSE 4332
VOLUME /data
ENV CLAWREFORM_HOME=/data
ENTRYPOINT ["clawreform"]
CMD ["start"]
