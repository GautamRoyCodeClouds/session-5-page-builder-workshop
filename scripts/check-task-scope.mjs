import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [taskId, base = "origin/main", head = "HEAD", workspace = process.cwd()] = process.argv.slice(2);

if (!taskId) {
  console.error("Usage: node scripts/check-task-scope.mjs <task-id> [base] [head] [workspace]");
  process.exit(2);
}

function git(args, options = {}) {
  return execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd: workspace,
    encoding: options.encoding ?? "utf8",
    maxBuffer: 16 * 1024 * 1024,
    env: {
      PATH: process.env.PATH,
      HOME: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_TERMINAL_PROMPT: "0"
    }
  });
}

function globRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const withDoubleStar = escaped.replaceAll("**", "\u0000");
  const withSingleStar = withDoubleStar.replaceAll("*", "[^/]*");
  return new RegExp(`^${withSingleStar.replaceAll("\u0000", ".*")}$`, "u");
}

function matchesAny(file, globs) {
  return globs.some((glob) => globRegex(glob).test(file));
}

function changedPaths() {
  const fields = git(["diff", "--name-status", "-z", "--find-renames", `${base}...${head}`])
    .split("\0")
    .filter(Boolean);
  const files = [];

  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (status.startsWith("R") || status.startsWith("C")) {
      files.push(fields[index++], fields[index++]);
    } else {
      files.push(fields[index++]);
    }
  }

  return [...new Set(files)];
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "workshop", "tasks.json"), "utf8"));
const task = manifest.tasks.find((candidate) => candidate.id.toLowerCase() === taskId.toLowerCase());

if (!task) {
  console.error(`Unknown task ID: ${taskId}`);
  process.exit(1);
}

git(["rev-parse", "--verify", `${base}^{commit}`]);
git(["rev-parse", "--verify", `${head}^{commit}`]);

const files = changedPaths();
const globalDenials = [
  ".github/workflows/**",
  "package.json",
  "package-lock.json",
  "Dockerfile",
  "compose.yaml",
  "review/**",
  "scripts/review-pr.sh",
  "scripts/agent-review-claude.sh",
  "AGENTS.md"
];
const violations = [];

for (const file of files) {
  if ([...file].some((character) => character.charCodeAt(0) < 32)) {
    violations.push({ file, reason: "control character in filename" });
    continue;
  }
  if (matchesAny(file, globalDenials)) {
    violations.push({ file, reason: "globally protected path" });
    continue;
  }
  if (!matchesAny(file, task.allowedFiles)) {
    violations.push({ file, reason: "outside task allowlist" });
  }
}

const rawStats = git(["diff", "--numstat", `${base}...${head}`]);
let changedLines = 0;
for (const line of rawStats.trim().split("\n").filter(Boolean)) {
  const [added, deleted, file] = line.split("\t");
  if (added === "-" || deleted === "-") {
    violations.push({ file, reason: "binary change" });
  } else {
    changedLines += Number(added) + Number(deleted);
  }
}
if (changedLines > 2500) {
  violations.push({ file: "(diff)", reason: `diff is too large: ${changedLines} changed lines` });
}

for (const file of files) {
  try {
    const record = git(["ls-tree", head, "--", file]).trim();
    if (record.startsWith("120000 ")) violations.push({ file, reason: "symlink change" });
    if (record.startsWith("160000 ")) violations.push({ file, reason: "submodule change" });
  } catch {
    // Deleted paths do not appear in the head tree.
  }
}

const result = {
  taskId: task.id,
  base: git(["rev-parse", base]).trim(),
  head: git(["rev-parse", head]).trim(),
  allowedFiles: task.allowedFiles,
  files,
  changedLines,
  violations
};

console.log(JSON.stringify(result, null, 2));
if (violations.length > 0) process.exit(1);
