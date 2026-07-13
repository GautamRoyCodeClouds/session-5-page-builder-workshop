import type { BrowserContext, Route } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

type Block =
  | { id: string; type: "heading"; text: string; level: 1 | 2 | 3 }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "button"; label: string; url: string }
  | { id: string; type: "section"; title: string };

interface ProjectInput {
  name: string;
  slug: string;
  blocks: Block[];
  textColor?: string | null;
  buttonColor?: string | null;
}

interface Project extends ProjectInput {
  id: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const publicRoot = resolve(process.cwd(), "public/builder");

function json(route: Route, status: number, value: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(value)
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPublished(project: Project): string {
  const content = project.blocks.map((block) => {
    if (block.type === "heading") {
      return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
    }
    if (block.type === "text") return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === "button") {
      return `<a href="${escapeHtml(block.url)}">${escapeHtml(block.label)}</a>`;
    }
    return `<section><h2>${escapeHtml(block.title)}</h2></section>`;
  }).join("");

  return `<!doctype html><html lang="en"><head><title>${escapeHtml(project.name)}</title></head><body>${content}</body></html>`;
}

async function serveAsset(route: Route, pathname: string): Promise<void> {
  const asset = pathname === "/" || pathname === "/builder/"
    ? "index.html"
    : pathname.replace(/^\/builder\//, "").replace(/^\//, "");
  const contentTypes: Record<string, string> = {
    "index.html": "text/html; charset=utf-8",
    "styles.css": "text/css; charset=utf-8",
    "app.js": "text/javascript; charset=utf-8"
  };
  const contentType = contentTypes[asset];
  if (!contentType) {
    await route.fulfill({ status: 404, body: "Not found" });
    return;
  }

  await route.fulfill({
    status: 200,
    contentType,
    body: await readFile(resolve(publicRoot, asset))
  });
}

export async function installBaselineRoutes(context: BrowserContext): Promise<void> {
  const projects = new Map<string, Project>();

  await context.route("http://127.0.0.1:3102/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (request.method() === "POST" && pathname === "/api/projects") {
      const input = request.postDataJSON() as ProjectInput;
      const now = new Date().toISOString();
      const project: Project = {
        ...input,
        textColor: input.textColor ?? null,
        buttonColor: input.buttonColor ?? null,
        id: randomUUID(),
        publishedAt: null,
        createdAt: now,
        updatedAt: now
      };
      projects.set(project.id, project);
      await json(route, 201, structuredClone(project));
      return;
    }

    if (request.method() === "GET" && pathname === "/api/projects") {
      const summaries = [...projects.values()]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((project) => ({
          id: project.id,
          name: project.name,
          slug: project.slug,
          publishedAt: project.publishedAt,
          updatedAt: project.updatedAt
        }));
      await json(route, 200, summaries);
      return;
    }

    const publishMatch = pathname.match(/^\/api\/projects\/([^/]+)\/publish$/);
    if (publishMatch && request.method() === "POST") {
      const project = projects.get(publishMatch[1]);
      if (!project) {
        await json(route, 404, { statusCode: 404, code: "PROJECT_NOT_FOUND", message: "Project not found" });
        return;
      }
      project.publishedAt = new Date().toISOString();
      project.updatedAt = project.publishedAt;
      await json(route, 201, { project: structuredClone(project), url: `/sites/${project.slug}` });
      return;
    }

    const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch && request.method() === "GET") {
      const project = projects.get(projectMatch[1]);
      if (!project) {
        await json(route, 404, { statusCode: 404, code: "PROJECT_NOT_FOUND", message: "Project not found" });
        return;
      }
      await json(route, 200, structuredClone(project));
      return;
    }

    if (projectMatch && request.method() === "PUT") {
      const project = projects.get(projectMatch[1]);
      if (!project) {
        await json(route, 404, { statusCode: 404, code: "PROJECT_NOT_FOUND", message: "Project not found" });
        return;
      }
      const input = request.postDataJSON() as ProjectInput;
      Object.assign(project, input, { updatedAt: new Date().toISOString() });
      await json(route, 200, structuredClone(project));
      return;
    }

    const siteMatch = pathname.match(/^\/sites\/([^/]+)$/);
    if (siteMatch && request.method() === "GET") {
      const project = [...projects.values()].find((candidate) => (
        candidate.slug === siteMatch[1] && candidate.publishedAt !== null
      ));
      if (!project) {
        await route.fulfill({ status: 404, body: "Not found" });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: renderPublished(project)
      });
      return;
    }

    await serveAsset(route, pathname);
  });
}
