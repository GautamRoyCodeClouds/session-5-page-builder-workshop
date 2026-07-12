# Security Policy

This repository is an educational workshop baseline, not a production-ready multi-user service. It intentionally omits authentication and authorization and must not be exposed to untrusted users without further engineering.

Report a vulnerability through GitHub's private security-advisory interface for this repository. Do not open a public issue containing exploit details or credentials.

Never send a maintainer a secret value. Pull requests may add an environment-variable name, startup validation, `.env.example` placeholder, and setup documentation. Real credential-dependent validation happens only after a separate trusted-code audit outside the public PR workflow.
