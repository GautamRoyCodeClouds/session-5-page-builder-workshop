#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
REVIEW_SCRIPT="$ROOT_DIR/scripts/review-pr.sh"
CLAUDE_SCRIPT="$ROOT_DIR/scripts/agent-review-claude.sh"
CHECK_SCRIPT="$ROOT_DIR/review/run-trusted-checks.sh"
DOCKERFILE="$ROOT_DIR/review/Dockerfile"
DOCKERIGNORE="$ROOT_DIR/review/Dockerfile.dockerignore"
SANITIZER="$ROOT_DIR/review/sanitize-evidence.mjs"

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

assert_contains() {
  local file=$1
  local pattern=$2
  local description=$3

  grep -Eq -- "$pattern" "$file" || fail "$description"
}

assert_not_contains() {
  local file=$1
  local pattern=$2
  local description=$3

  if grep -Eq -- "$pattern" "$file"; then
    fail "$description"
  fi
}

assert_literal() {
  local file=$1
  local value=$2
  local description=$3

  grep -Fq -- "$value" "$file" || fail "$description"
}

for file in "$REVIEW_SCRIPT" "$CLAUDE_SCRIPT" "$CHECK_SCRIPT"; do
  [[ -f "$file" ]] || fail "missing shell script: $file"
  bash -n "$file"
done

[[ -f "$DOCKERFILE" ]] || fail "missing Dockerfile: $DOCKERFILE"
[[ -f "$DOCKERIGNORE" ]] || fail "missing Dockerfile-specific context allowlist: $DOCKERIGNORE"
[[ -f "$SANITIZER" ]] || fail "missing evidence sanitizer: $SANITIZER"

if "$REVIEW_SCRIPT" >/dev/null 2>&1; then
  fail "review-pr.sh must reject missing PR and task arguments"
fi

if "$REVIEW_SCRIPT" 12 '../not-a-task' >/dev/null 2>&1; then
  fail "review-pr.sh must reject an invalid task ID before using gh"
fi

assert_contains "$REVIEW_SCRIPT" 'headRefOid' \
  'review-pr.sh must read the immutable PR head SHA from gh metadata'
assert_literal "$REVIEW_SCRIPT" '^[0-9a-f]{40}$' \
  'review-pr.sh must reject a missing, abbreviated, or malformed SHA'
assert_contains "$REVIEW_SCRIPT" 'rev-parse.+HEAD\^\{commit\}' \
  'review-pr.sh must resolve the checked-out commit'
assert_contains "$REVIEW_SCRIPT" 'check-task-scope\.mjs' \
  'review-pr.sh must call the trusted task-scope checker'
assert_contains "$REVIEW_SCRIPT" '--network[= ]none' \
  'review container must have no external network'
assert_contains "$REVIEW_SCRIPT" '--read-only' \
  'review container root must be read-only'
assert_contains "$REVIEW_SCRIPT" '--cap-drop[= ]ALL' \
  'review container must drop Linux capabilities'
assert_contains "$REVIEW_SCRIPT" 'no-new-privileges' \
  'review container must set no-new-privileges'
assert_contains "$REVIEW_SCRIPT" ':/workspace:ro' \
  'the PR checkout must be mounted read-only'
assert_contains "$REVIEW_SCRIPT" 'docker[[:space:]]+cp' \
  'results must be copied out without a writable host mount'
assert_contains "$REVIEW_SCRIPT" 'review-input\.txt' \
  'review-pr.sh must produce a review-input.txt evidence bundle'
assert_not_contains "$REVIEW_SCRIPT" 'gh[[:space:]]+pr[[:space:]]+merge' \
  'review-pr.sh must never merge a pull request'
assert_not_contains "$REVIEW_SCRIPT" '(docker\.sock|\.ssh|\.aws|\.config/(gh|claude|codex))' \
  'review-pr.sh must not mount host credentials or the Docker socket'
assert_not_contains "$REVIEW_SCRIPT" '--env-file' \
  'review-pr.sh must not pass a host environment file into the container'

volume_count=$(grep -Ec -- '--volume' "$REVIEW_SCRIPT")
[[ $volume_count -eq 1 ]] || fail 'review-pr.sh must have only the read-only source volume'

assert_contains "$CLAUDE_SCRIPT" '--safe-mode' \
  'Claude review must enable safe mode'
assert_contains "$CLAUDE_SCRIPT" '--disable-slash-commands' \
  'Claude review must disable slash commands'
assert_contains "$CLAUDE_SCRIPT" '--tools' \
  'Claude review must explicitly disable built-in tools'
assert_contains "$CLAUDE_SCRIPT" 'mcp__\*' \
  'Claude review must deny MCP tools'
assert_contains "$CLAUDE_SCRIPT" '--no-session-persistence' \
  'Claude review must disable session persistence'
assert_contains "$CLAUDE_SCRIPT" 'credential_redactions_detected: yes' \
  'Claude review must refuse evidence with credential redactions'

assert_contains "$DOCKERFILE" '^USER[[:space:]]+reviewer' \
  'the trusted checks must run as a non-root user'
assert_contains "$DOCKERFILE" 'postgres:17' \
  'the review image must include PostgreSQL 17'
assert_literal "$DOCKERIGNORE" '**' \
  'the review image context must exclude files by default'
assert_literal "$DOCKERIGNORE" 'review/*' \
  'the review image context must re-exclude unrelated review files'
assert_literal "$DOCKERIGNORE" '!review/run-trusted-checks.sh' \
  'the review image context must include the trusted entrypoint'
assert_contains "$CHECK_SCRIPT" 'listen_addresses=127\.0\.0\.1' \
  'PostgreSQL must listen only on container loopback'
assert_contains "$CHECK_SCRIPT" '/workspace' \
  'the entrypoint must read the mounted PR checkout'
assert_contains "$CHECK_SCRIPT" '/work' \
  'the entrypoint must execute from tmpfs workspace storage'

SANITIZER_FIXTURE=$(mktemp -d "${TMPDIR:-/tmp}/session5-sanitizer-test.XXXXXXXX")
printf 'OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnop\nplain text\n' \
  >"$SANITIZER_FIXTURE/input.txt"
node "$SANITIZER" sanitize "$SANITIZER_FIXTURE/input.txt" \
  >"$SANITIZER_FIXTURE/output.txt"
assert_not_contains "$SANITIZER_FIXTURE/output.txt" 'sk-proj-1234567890abcdefghijklmnop' \
  'evidence sanitizer must remove credential-shaped values'
assert_contains "$SANITIZER_FIXTURE/output.txt" '\[REDACTED:' \
  'evidence sanitizer must mark redacted values'
node "$SANITIZER" report "$SANITIZER_FIXTURE/input.txt" \
  >"$SANITIZER_FIXTURE/report.json"
assert_contains "$SANITIZER_FIXTURE/report.json" '"redactionsDetected": true' \
  'evidence sanitizer report must flag credential-shaped values'

SCOPE_FIXTURE=$(mktemp -d "${TMPDIR:-/tmp}/session5-scope-test.XXXXXXXX")
cleanup() {
  rm -rf -- "$SANITIZER_FIXTURE"
  rm -rf -- "$SCOPE_FIXTURE"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

git -C "$SCOPE_FIXTURE" init --quiet
git -C "$SCOPE_FIXTURE" -c user.name=Review -c user.email=review@invalid.example \
  commit --quiet --allow-empty -m base
base_sha=$(git -C "$SCOPE_FIXTURE" rev-parse HEAD)
printf '{"name":"forbidden"}\n' >"$SCOPE_FIXTURE/package.json"
git -C "$SCOPE_FIXTURE" add package.json
git -C "$SCOPE_FIXTURE" -c user.name=Review -c user.email=review@invalid.example \
  commit --quiet -m violation
head_sha=$(git -C "$SCOPE_FIXTURE" rev-parse HEAD)

if node "$ROOT_DIR/scripts/check-task-scope.mjs" BE-01 "$base_sha" "$head_sha" \
  "$SCOPE_FIXTURE" >"$SCOPE_FIXTURE/result.json" 2>"$SCOPE_FIXTURE/result.stderr"; then
  fail 'trusted task-scope checker accepted a protected-path change'
fi
if grep -Eq 'globally protected path' "$SCOPE_FIXTURE/result.json"; then
  :
elif grep -Eq 'spawnSync git EPERM' "$SCOPE_FIXTURE/result.stderr"; then
  # Some managed command sandboxes deny Node child_process even though direct
  # Git calls work. Keep the source-level contract check in that environment.
  assert_contains "$ROOT_DIR/scripts/check-task-scope.mjs" 'globally protected path' \
    'scope checker must explain protected-path violations'
  printf 'SKIP: runtime scope fixture (Node child_process denied by sandbox)\n'
else
  cat "$SCOPE_FIXTURE/result.stderr" >&2
  fail 'scope violation result must explain the protected path'
fi

if command -v claude >/dev/null 2>&1; then
  claude_help=$(claude --help)
  for flag in --safe-mode --disable-slash-commands --tools --disallowedTools \
    --strict-mcp-config --no-session-persistence; do
    [[ $claude_help == *"$flag"* ]] || fail "installed Claude CLI does not support $flag"
  done
fi

if command -v codex >/dev/null 2>&1; then
  codex_help=$(codex exec --help 2>&1)
  for flag in --sandbox --ephemeral --ignore-user-config --ignore-rules --output-schema; do
    [[ $codex_help == *"$flag"* ]] || fail "installed Codex CLI does not support documented $flag"
  done
fi

printf 'PASS: review harness static contract\n'
