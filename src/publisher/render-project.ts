import type { Block } from "../projects/types/blocks";
import type { ProjectDocument } from "./project-document";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeUrl(value: string): boolean {
  const candidate = value.trim();
  if (!/^https?:\/\//i.test(candidate)) {
    return false;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case "heading":
      return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
    case "text":
      return `<p>${escapeHtml(block.text)}</p>`;
    case "button":
      if (!isSafeUrl(block.url)) {
        return `<span class="button" aria-disabled="true">${escapeHtml(block.label)}</span>`;
      }
      return `<a class="button" href="${escapeHtml(block.url.trim())}">${escapeHtml(block.label)}</a>`;
    case "section":
      return `<section><h2>${escapeHtml(block.title)}</h2></section>`;
    case "divider":
      return "<hr>";
  }
}

export function renderProject(project: ProjectDocument, language = "en"): string {
  const content = project.blocks.map(renderBlock).join("\n");
  const description = typeof project.description === "string" ? project.description.trim() : "";
  const descriptionMeta = description.length > 0
    ? `\n  <meta name="description" content="${escapeHtml(description)}">`
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">${descriptionMeta}
  <title>${escapeHtml(project.name)}</title>
  <style>
    body { box-sizing: border-box; color: #1f2933; font-family: system-ui, sans-serif; line-height: 1.6; margin: 0 auto; max-width: 72rem; padding: 3rem 1.25rem; }
    .button { background: #176b5b; color: #fff; display: inline-block; padding: .65rem 1rem; text-decoration: none; }
    [aria-disabled="true"] { cursor: not-allowed; opacity: .65; }
    section { border-top: 1px solid #d8dee4; margin-top: 2rem; padding-top: 1rem; }
  </style>
</head>
<body>
  <main>
${content}
  </main>
</body>
</html>
`;
}
