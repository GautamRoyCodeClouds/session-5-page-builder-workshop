# Session 5 Page Builder Workshop

A deliberately small but complete NestJS application for the **Gen AI for Backend Engineering** workshop. Attendees fork this baseline, use their preferred coding agent to complete one bounded task, and submit a focused pull request with evidence.

## What It Does

- Compose a static page from Heading, Text, Button, and Section blocks.
- Add blocks by click or drag and reorder them with pointer drag-and-drop.
- Edit typed properties in a labeled inspector.
- Save and reload ordered project JSON through NestJS and PostgreSQL.
- Publish escaped static HTML at `/sites/{slug}`.
- Explore the OpenAPI contract at `/api/docs`.

This is workshop software. It has no authentication or authorization and is not production-ready.

## Requirements

- Node.js 22 or newer
- Docker with Docker Compose
- Git and a GitHub account
- One coding agent for the workshop activity

## Start Locally

```bash
npm ci
cp .env.example .env
docker compose up -d --wait postgres
npm run prisma:deploy
npm run start:dev
```

Open:

- Builder: `http://localhost:3000/builder/`
- Swagger: `http://localhost:3000/api/docs`
- Health: `http://localhost:3000/health`

## Verification

```bash
npm run build
npm run lint
npm run policy
npm run test:unit
npm run test:api
npm run test:browser
```

Test scripts accept a filter after `--`. An unknown filter exits nonzero:

```bash
npm run test:unit -- publisher
npm run test:api -- projects
npm run test:browser -- filter-contract
```

## Workshop Workflow

Read [CONTRIBUTING.md](CONTRIBUTING.md), choose one card from [workshop/TASKS.md](workshop/TASKS.md), and follow [AGENTS.md](AGENTS.md) when prompting an agent. Divider is reserved for the presenter demonstration and is intentionally absent from the attendee catalogue.

Maintainers should prepare the local reviewer described in [docs/LOCAL_REVIEW.md](docs/LOCAL_REVIEW.md) before accepting public pull requests.

## Docker Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the optional full-stack Compose profile.
