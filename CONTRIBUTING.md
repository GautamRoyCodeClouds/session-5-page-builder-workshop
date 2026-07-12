# Contributing During Session 5

## Preflight

Complete this before the workshop:

```bash
npm ci
docker compose up -d --wait postgres
npm run prisma:deploy
npm run build
npm run test:unit
```

GitHub CLI is optional. You may fork and open a pull request through github.com and use ordinary Git commands locally.

## Contribution Flow

1. Choose one task from the shared deck or `workshop/TASKS.md`.
2. Sync your fork's `main` with the workshop repository.
3. Create a branch named `task/<task-id>-short-name`.
4. Give your coding agent the complete task prompt and ask it to inspect before editing.
5. Approve a small plan, implement only the permitted files, and run every exact task command.
6. Inspect `git diff --check` and the complete diff.
7. Open one focused pull request using the repository template.

Duplicate task selections are allowed. A reviewable PR is a successful workshop outcome even when a different implementation is ultimately merged.

## Pull Request Rules

- Keep the PR limited to one task ID.
- Do not change dependencies, lockfiles, workflows, Docker configuration, review scripts, or `AGENTS.md`.
- Do not include generated files or drive-by formatting.
- Do not include API keys, tokens, passwords, private endpoints, or other secret values in Git, chat, comments, logs, screenshots, or private messages.
- Configuration work documents variable names and safe placeholders only.
- Record exact commands and outcomes; do not claim a test passed unless it ran at the submitted head SHA.

The maintainer reviews untrusted PR code locally in an isolated environment. An agent verdict is advisory; the maintainer makes the merge decision.
