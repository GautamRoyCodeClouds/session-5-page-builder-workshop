#!/usr/bin/env bash
set -Eeuo pipefail

readonly SOURCE_MOUNT=/workspace
readonly WORK_ROOT=/work
readonly SOURCE_COPY="$WORK_ROOT/source"
readonly OUTPUT_DIR=/review-output
readonly RESULTS_FILE="$OUTPUT_DIR/container-results.txt"
readonly SUMMARY_FILE="$OUTPUT_DIR/check-summary.tsv"
readonly POSTGRES_PORT=55432

fail() {
  printf 'REVIEW SETUP FAIL: %s\n' "$*" >&2
  exit 2
}

[[ $(id -u) -ne 0 ]] || fail 'trusted checks must not run as root'
[[ -r "$SOURCE_MOUNT/package.json" ]] || fail 'read-only source mount is missing package.json'
[[ -w "$WORK_ROOT" ]] || fail '/work must be a writable tmpfs owned by the reviewer user'
[[ -w "$OUTPUT_DIR" ]] || fail '/review-output must be a writable tmpfs'
[[ ! -S /var/run/docker.sock ]] || fail 'Docker socket must not be present'

for credential_name in \
  GH_TOKEN GITHUB_TOKEN GITLAB_TOKEN ANTHROPIC_API_KEY OPENAI_API_KEY \
  AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN \
  AZURE_CLIENT_SECRET GOOGLE_APPLICATION_CREDENTIALS SSH_AUTH_SOCK DOCKER_HOST; do
  if [[ -n ${!credential_name:-} ]]; then
    fail "credential-bearing environment variable is present: $credential_name"
  fi
done

if touch "$SOURCE_MOUNT/.review-write-probe" 2>/dev/null; then
  rm -f "$SOURCE_MOUNT/.review-write-probe"
  fail 'source mount is writable; expected /workspace:ro'
fi

mkdir -p "$SOURCE_COPY" "$OUTPUT_DIR" /tmp/home /tmp/npm-cache

# The host exports a git-free tree. Copy both source and trusted dependencies
# into disposable tmpfs before any PR-controlled command runs.
tar -C "$SOURCE_MOUNT" --exclude='./.git' -cf - . | tar -C "$SOURCE_COPY" -xf -
cp -a /opt/review/node_modules "$SOURCE_COPY/node_modules"

export HOME=/tmp/home
export XDG_CACHE_HOME=/tmp/home/.cache
export GIT_CONFIG_NOSYSTEM=1
export GIT_CONFIG_GLOBAL=/dev/null
export npm_config_cache=/tmp/npm-cache
export npm_config_offline=true
export npm_config_audit=false
export npm_config_fund=false
export DATABASE_URL="postgresql://reviewer@127.0.0.1:${POSTGRES_PORT}/session5_review?schema=public"
export DIRECT_URL="$DATABASE_URL"
export PUBLISH_DIR="$WORK_ROOT/published"

mkdir -p "$PUBLISH_DIR"
cd "$SOURCE_COPY"

# scripts/policy.mjs inspects tracked and untracked files. The host deliberately
# omits the clone's .git directory, so create isolated metadata with no remote,
# hooks, credentials, or host Git configuration.
git -c core.hooksPath=/dev/null init --quiet
git -c core.hooksPath=/dev/null config user.name 'Trusted Review'
git -c core.hooksPath=/dev/null config user.email 'review@invalid.example'
git -c core.hooksPath=/dev/null add --all
git -c core.hooksPath=/dev/null commit --quiet --no-gpg-sign -m 'ephemeral review source'

PGDATA="$WORK_ROOT/postgres-data"
PGLOG="$OUTPUT_DIR/postgres.log"
export PGDATA

cleanup() {
  if [[ -s "$PGDATA/postmaster.pid" ]]; then
    pg_ctl -D "$PGDATA" -m immediate stop >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

mkdir -p "$PGDATA"
initdb --pgdata="$PGDATA" --username=reviewer --auth-local=trust --auth-host=trust \
  --encoding=UTF8 --locale=C >/dev/null
pg_ctl -D "$PGDATA" -l "$PGLOG" -o \
  "-c listen_addresses=127.0.0.1 -c port=${POSTGRES_PORT} -c unix_socket_directories=/tmp -c fsync=off -c full_page_writes=off -c synchronous_commit=off" \
  -w start >/dev/null
createdb --host=127.0.0.1 --port="$POSTGRES_PORT" --username=reviewer session5_review

: >"$RESULTS_FILE"
printf 'check\texit_code\n' >"$SUMMARY_FILE"

failures=0
check_number=0

run_check() {
  local label=$1
  shift
  local -a command=("$@")
  local status
  local timeout_seconds=${REVIEW_CHECK_TIMEOUT_SECONDS:-900}

  check_number=$((check_number + 1))
  {
    printf '\n===== CHECK %d: %s =====\n' "$check_number" "$label"
    printf 'command:'
    printf ' %q' "${command[@]}"
    printf '\n'
  } | tee -a "$RESULTS_FILE"

  set +e
  timeout --foreground --signal=TERM --kill-after=30s \
    "${timeout_seconds}s" "${command[@]}" 2>&1 | tee -a "$RESULTS_FILE"
  status=${PIPESTATUS[0]}
  set -e

  printf 'exit_code: %d\n' "$status" | tee -a "$RESULTS_FILE"
  printf '%s\t%d\n' "$label" "$status" >>"$SUMMARY_FILE"
  if [[ $status -ne 0 ]]; then
    failures=$((failures + 1))
  fi
}

{
  printf 'trusted_source_sha: %s\n' "${REVIEW_HEAD_SHA:-unknown}"
  printf 'task_id: %s\n' "${REVIEW_TASK_ID:-unknown}"
  printf 'uid: %s\n' "$(id -u)"
  printf 'network_contract: Docker --network none; PostgreSQL loopback only\n'
  printf 'source_contract: /workspace read-only; execution copy in /work tmpfs\n'
} >>"$RESULTS_FILE"

run_check 'npm run policy' npm run policy
run_check 'npm run build' npm run build
run_check 'npm run lint' npm run lint
run_check 'npm run prisma:deploy' npm run prisma:deploy
run_check 'npm run test:unit' npm run test:unit
run_check 'npm run test:api' npm run test:api
run_check 'npm run test:browser' npm run test:browser

{
  printf '\n===== SUMMARY =====\n'
  cat "$SUMMARY_FILE"
  printf 'failed_checks: %d\n' "$failures"
} | tee -a "$RESULTS_FILE"

if [[ $failures -ne 0 ]]; then
  exit 1
fi
