# Trusted Local Pull Request Review

This harness reviews one workshop pull request at an immutable head commit. It
does not run attendee code on the credential-bearing host, post a GitHub review,
or merge anything. The presenter remains responsible for reading the evidence,
posting feedback, and deciding whether to merge.

## Trust Boundaries

The host-side script is run only from a clean, reviewed `main` commit. It uses
`gh` to read PR metadata, including `baseRefOid` and `headRefOid`, then creates a
disposable clone. The fetched `refs/pull/<number>/head` commit must exactly match
the metadata head SHA. A mismatch stops the review and requires a fresh run.

Before any PR command executes, the host calls the trusted scope checker with
the selected task and exact commits:

```text
node scripts/check-task-scope.mjs <TASK_ID> <BASE_SHA> <HEAD_SHA> <CLONE_PATH>
```

The checker rejects protected paths, paths outside the task allowlist, binary or
oversized changes, changed symlinks, and changed submodules. Task criteria come
from the trusted `main` copy of `workshop/tasks.json`, not from the PR.

The host exports the exact head as a git-free source tree and mounts that export
at `/workspace:ro`. The container entrypoint copies it and the preinstalled
trusted dependencies to `/work`, a writable tmpfs, before running any PR code.
Results stay in container tmpfs and are retrieved with `docker cp`; there is no
writable host mount. The authoritative exit code comes from Docker, and raw
container output is captured to a presenter-owned file rather than streamed to
the terminal. Tmpfs reports copied from the container are supplementary because
PR processes can write to the same ephemeral filesystem.

## Build The Trusted Image

Build before reviewing attendee pull requests. Image construction may use the
network to install the dependency lockfile and Playwright Chromium; PR test
execution later uses `--network none`.

```bash
git switch main
git status --short
TRUSTED_SHA=$(git rev-parse HEAD)
IMAGE="session5-review:trusted-${TRUSTED_SHA:0:12}"
docker build \
  --build-arg "TRUSTED_SOURCE_SHA=$TRUSTED_SHA" \
  --tag "$IMAGE" \
  --file review/Dockerfile .
```

The image label records the trusted SHA. `review-pr.sh` refuses an image whose
label differs from its current trusted `main` commit. Rebuild after changes to
the baseline lockfile or review entrypoint. `review/Dockerfile.dockerignore`
limits the build context to the package manifests, Dockerfile, and trusted
entrypoint, so repository source, Git metadata, and local files are not sent to
the build daemon.

The image contains Node 22, dependencies from the trusted lockfile, Playwright
Chromium, and PostgreSQL 17. Tests run as the unprivileged `reviewer` user.
PostgreSQL starts in the same container, listens only on `127.0.0.1`, and stores
its database in tmpfs.

## Review One Pull Request

Prerequisites are Bash, GNU `timeout`, Git, GitHub CLI authenticated for host
metadata access, Node.js, Docker, and the prebuilt image.

```bash
scripts/review-pr.sh 123 BE-04 \
  --repo GautamRoyCodeClouds/session-5-page-builder-workshop
```

The task ID is mandatory. The script checks that the PR is open and targets
`main`, verifies both full SHAs, applies the trusted task-scope gate, and runs:

```text
npm run policy
npm run build
npm run lint
npm run prisma:deploy
npm run test:unit
npm run test:api
npm run test:browser
```

Each command has an in-container timeout and the whole container has a host-side
wall-clock deadline. Override the latter only when needed:

```bash
REVIEW_WALL_TIMEOUT_SECONDS=5400 scripts/review-pr.sh 123 BE-04 --repo OWNER/REPO
```

Docker is started with no network, a read-only root, all capabilities dropped,
`no-new-privileges`, CPU/memory/PID limits, a read-only source mount, and only
ephemeral writable tmpfs paths. The command does not pass through GitHub,
Claude, Codex, SSH, AWS, Azure, Google Cloud, or application credentials. It
does not mount the host home or Docker socket. The entrypoint also rejects
common credential variables and a visible Docker socket.

Successful and failed test runs both retain presenter-owned evidence under
`${XDG_STATE_HOME:-$HOME/.local/state}/session5-review/` by default. Use
`--output-dir` with a new absolute path to select a directory. A path-scope
failure stops before the container runs and retains the scope report for human
inspection.

After the container stops, the host reads PR metadata again. If the current base
or head no longer matches the tested SHAs, the review exits nonzero and the
evidence records the stale-metadata condition. Start a fresh review against the
new commit pair.

## Evidence And Claude

`review-input.txt` contains the verified base/head SHAs, trusted task criteria,
scope result, changed paths, full diff, exact container commands and exit codes,
and test output. Control characters are escaped. Diff and test content remain
untrusted and can contain prompt-injection text.

Claude review is optional and advisory:

```bash
scripts/agent-review-claude.sh \
  /absolute/path/to/evidence/review-input.txt > claude-verdict.json
```

The wrapper copies only `review-input.txt` into an otherwise empty temporary
directory. It uses `--safe-mode`, disables slash commands, sets `--tools ""`,
denies `mcp__*`, supplies an empty strict MCP configuration, disables Chrome,
uses noninteractive `dontAsk` permissions, and disables session persistence.
Claude cannot inspect the PR checkout or execute it. Safe mode may still be
subject to administrator-managed policy, so verify the installed CLI flags with
`claude --help` and treat every verdict as untrusted advice.

Do not run the wrapper from the disposable clone and do not put secrets in the
evidence bundle. Authentication used by the Claude CLI remains on the host; it
is never passed to the test container or included in the prompt.

## Conditional Codex Use

This repository intentionally has no Codex review wrapper. Codex's own
`--sandbox read-only` still permits model-directed reads and command execution;
it is not the outer boundary required for hostile PR evidence. Use Codex only
inside a separately configured OS sandbox or disposable VM that exposes the
evidence file and response destination but hides the PR checkout, host home,
SSH agent, Docker socket, and every reusable credential. Inside that boundary,
use an ephemeral session, ignore user configuration and rules, deny approvals,
use a read-only Codex sandbox, and constrain the final response with JSON Schema.
If that external boundary has not been independently verified, skip Codex.

## Docker Is Defense In Depth

Ordinary Docker containers share the host kernel. These controls reduce the
attack surface but are not an absolute isolation boundary against malicious
native code, kernel vulnerabilities, or a compromised Docker daemon. Never
expose `/var/run/docker.sock`; control of the daemon is effectively host control.

For higher-assurance review of unknown contributors, run the Docker daemon and
this entire harness inside a disposable, fully patched VM with no host-shared
home directories, credentials, clipboard integration, or sensitive mounts.
Destroy the VM after exporting the sanitized evidence. A dedicated remote
machine with equivalent isolation is also suitable.

## Human Gate

The harness never calls `gh pr review`, `gh pr comment`, or `gh pr merge`. Read
the diff, scope report, full logs, and any advisory agent findings yourself.
Post specific feedback manually. Only after an explicit presenter decision may
the presenter run a separate immediate squash merge command. Do not enable
automatic merge for this workflow.

## Static Verification

The local contract test does not contact GitHub, invoke a model, or run PR code:

```bash
bash review/test-harness-static.sh
```

It runs `bash -n`, checks missing/invalid arguments, asserts the exact-SHA and
task-scope gates are present, verifies the Docker hardening flags and read-only
mount, checks the Claude restrictions, and rejects merge commands or host
credential/socket mounts in the host script. It also creates a temporary Git
fixture to prove a protected-path change is rejected and, when installed,
parses Claude/Codex CLI help to confirm the documented flags without invoking a
model.
