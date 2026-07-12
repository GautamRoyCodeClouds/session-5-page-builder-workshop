# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS node-runtime

FROM postgres:17-bookworm

ARG TRUSTED_SOURCE_SHA=unknown

LABEL org.opencontainers.image.title="Session 5 trusted PR reviewer" \
      org.opencontainers.image.revision="$TRUSTED_SOURCE_SHA"

COPY --from=node-runtime /usr/local/ /usr/local/

WORKDIR /opt/review

COPY package.json package-lock.json ./

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates chromium git \
    && rm -rf /var/lib/apt/lists/* \
    && npm ci --ignore-scripts \
    && npm cache clean --force \
    && useradd --create-home --home-dir /home/reviewer --shell /usr/sbin/nologin --uid 10001 reviewer \
    && chown -R reviewer:reviewer /opt/review /home/reviewer

COPY --chown=root:root review/run-trusted-checks.sh /usr/local/bin/run-trusted-checks

RUN chmod 0555 /usr/local/bin/run-trusted-checks

ENV CI=1 \
    HOME=/home/reviewer

USER reviewer

ENTRYPOINT ["/usr/local/bin/run-trusted-checks"]
CMD []
