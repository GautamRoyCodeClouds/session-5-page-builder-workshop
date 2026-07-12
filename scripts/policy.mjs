import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`POLICY FAIL: ${message}`);
  process.exitCode = 1;
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "workshop", "tasks.json"), "utf8"));
const expectedCounts = { backend: 12, frontend: 15, quality: 15, qa: 15, review: 10 };
const counts = Object.fromEntries(Object.keys(expectedCounts).map((key) => [key, 0]));

if (!Array.isArray(manifest.tasks) || manifest.tasks.length !== 67) {
  fail("task catalogue must contain exactly 67 tasks");
} else {
  for (const task of manifest.tasks) {
    if (!(task.category in counts)) fail(`unsupported category on ${task.id}`);
    else counts[task.category] += 1;
    if (!Array.isArray(task.allowedFiles) || task.allowedFiles.length === 0) fail(`${task.id} has no allowed files`);
    if (!Array.isArray(task.verify) || task.verify.some((command) => !command.startsWith("npm run "))) {
      fail(`${task.id} has an invalid verification command`);
    }
  }
  if (JSON.stringify(counts) !== JSON.stringify(expectedCounts)) fail(`task counts differ: ${JSON.stringify(counts)}`);
}

const commands = [...new Set(manifest.tasks.flatMap((task) => task.verify))];
if (commands.length !== 40) fail(`expected 40 distinct task commands, received ${commands.length}`);
if (JSON.stringify(manifest).includes("Divider")) fail("Divider is reserved for the presenter");

const visibleFiles = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
  cwd: root,
  encoding: "utf8"
}).split("\0").filter(Boolean);

const forbiddenPaths = [
  /^\.env$/u,
  /^\.env\..*\.local$/u,
  /^\.github\/workflows\//u,
  /(^|\/)node_modules\//u,
  /(^|\/)dist\//u,
  /^\.data\//u,
  /^review-output\//u
];

for (const file of visibleFiles) {
  if (forbiddenPaths.some((pattern) => pattern.test(file))) fail(`forbidden repository path: ${file}`);
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute) || fs.statSync(absolute).size > 1024 * 1024 || file === "package-lock.json") continue;
  const content = fs.readFileSync(absolute, "utf8");
  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /\bghp_[A-Za-z0-9]{30,}\b/u,
    /\bgithub_pat_[A-Za-z0-9_]{30,}\b/u,
    /\bAKIA[0-9A-Z]{16}\b/u,
    /\bsk-[A-Za-z0-9]{24,}\b/u
  ];
  if (secretPatterns.some((pattern) => pattern.test(content))) fail(`credential-shaped value in ${file}`);
}

if (process.env.TASK_ID) {
  const base = process.env.POLICY_BASE || "origin/main";
  const result = spawnSync(process.execPath, [
    path.join(root, "scripts", "check-task-scope.mjs"),
    process.env.TASK_ID,
    base,
    "HEAD",
    root
  ], { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exitCode = 1;
}

if (!process.exitCode) {
  console.log(`POLICY PASS: 67 tasks, 40 commands, ${visibleFiles.length} repository files checked`);
}
