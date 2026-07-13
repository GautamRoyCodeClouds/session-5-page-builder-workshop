#!/usr/bin/env node
// Redacts credential-shaped substrings from review evidence before it is
// written to review-input.txt or shown to an advisory LLM reviewer.
//
// Usage:
//   node sanitize-evidence.mjs sanitize <file>   -> sanitized text on stdout
//   node sanitize-evidence.mjs report <file>     -> JSON summary on stdout

import { readFileSync } from "node:fs";

// Each pattern targets one common credential shape. Matches are replaced with
// a `[REDACTED:<TYPE>]` marker so evidence stays legible without exposing the
// underlying secret. Order matters: more specific patterns run first so a
// generic KEY/SECRET/TOKEN assignment does not re-wrap an already-redacted
// value.
const PATTERNS = [
  { type: "PRIVATE_KEY_BLOCK", regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { type: "OPENAI_KEY", regex: /\bsk-[A-Za-z0-9_-]{16,}\b/g },
  { type: "AWS_ACCESS_KEY", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { type: "GITHUB_TOKEN", regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { type: "SLACK_TOKEN", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { type: "JWT", regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { type: "BEARER_TOKEN", regex: /\bBearer\s+[A-Za-z0-9._-]{16,}\b/gi },
  { type: "CREDENTIALED_URL", regex: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:[^\s@]+@/gi },
  { type: "GENERIC_SECRET_ASSIGNMENT", regex: /\b([A-Z0-9_]*(?:API|SECRET|TOKEN|PASSWORD|PASSWD|KEY)[A-Z0-9_]*)\s*[:=]\s*['"]?[A-Za-z0-9/+_.-]{12,}['"]?/g }
];

function sanitize(text) {
  let redactions = 0;
  let output = text;
  for (const { type, regex } of PATTERNS) {
    output = output.replace(regex, (match) => {
      redactions += 1;
      const equalsIndex = match.search(/[:=]/);
      const prefix = type === "GENERIC_SECRET_ASSIGNMENT" && equalsIndex > -1
        ? match.slice(0, equalsIndex + 1)
        : "";
      return `${prefix}[REDACTED:${type}]`;
    });
  }
  return { output, redactions };
}

function main() {
  const [, , command, filePath] = process.argv;
  if (!filePath || (command !== "sanitize" && command !== "report")) {
    process.stderr.write("Usage: sanitize-evidence.mjs <sanitize|report> <file>\n");
    process.exit(2);
  }

  const text = readFileSync(filePath, "utf8");
  const { output, redactions } = sanitize(text);

  if (command === "sanitize") {
    process.stdout.write(output);
    return;
  }

  process.stdout.write(`${JSON.stringify({
    redactionsDetected: redactions > 0,
    redactionCount: redactions
  }, null, 2)}\n`);
}

main();
