import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { readdir, rm } from "node:fs/promises";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { configureApplication } from "../../src/main";
import { AppConfigService } from "../../src/common/config/app-config.service";
import { PrismaService } from "../../src/database/prisma.service";

type ProjectResponse = {
  id: string;
  name: string;
  slug: string;
  blocks: unknown[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const baselineBlocks = [
  { id: "heading-1", type: "heading", text: "Welcome", level: 1 },
  { id: "text-1", type: "text", text: "Original body" },
  { id: "button-1", type: "button", label: "Open", url: "https://example.com" },
  { id: "section-1", type: "section", title: "Details" }
];

describe("project API", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let config: AppConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
    config = app.get(AppConfigService);
  });

  beforeEach(async () => {
    await prisma.project.deleteMany();
    await rm(config.publishDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    await app.close();
  });

  async function createProject(overrides: Record<string, unknown> = {}): Promise<ProjectResponse> {
    const response = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Workshop page", slug: "workshop-page", blocks: baselineBlocks, ...overrides })
      .expect(201);
    return response.body as ProjectResponse;
  }

  it("exposes liveness, Swagger, and the builder redirect", async () => {
    await request(app.getHttpServer()).get("/health").expect(200, { status: "ok" });
    await request(app.getHttpServer()).get("/api/docs").expect(200).expect("content-type", /html/);
    await request(app.getHttpServer())
      .get("/api/openapi.json")
      .expect(200)
      .expect("content-type", /json/)
      .expect(({ body }: { body: { openapi?: string } }) => {
        expect(body.openapi).toBe("3.0.0");
      });
    await request(app.getHttpServer()).get("/").expect(302).expect("location", "/builder/");
  });

  it("creates and loads a project with typed ordered blocks", async () => {
    const created = await createProject();

    expect(created).toMatchObject({
      name: "Workshop page",
      slug: "workshop-page",
      blocks: baselineBlocks,
      publishedAt: null
    });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Date.parse(created.createdAt)).not.toBeNaN();

    await request(app.getHttpServer())
      .get(`/api/projects/${created.id}`)
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body).toEqual(created);
      });
  });

  it("replaces editable project fields and ordered blocks", async () => {
    const created = await createProject();
    const replacement = {
      name: "Updated page",
      slug: "updated-page",
      blocks: [...baselineBlocks].reverse()
    };

    await request(app.getHttpServer())
      .put(`/api/projects/${created.id}`)
      .send(replacement)
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body).toMatchObject(replacement);
        expect(body.id).toBe(created.id);
      });
  });

  it.each([
    ["empty name", { name: "" }],
    ["whitespace-only name", { name: "   " }],
    ["uppercase slug", { slug: "Not-Lowercase" }],
    ["unknown block", { blocks: [{ id: "x", type: "divider" }] }],
    ["duplicate block ID", { blocks: [
      { id: "same", type: "text", text: "First" },
      { id: "same", type: "section", title: "Second" }
    ] }]
  ])("returns the common 400 envelope for an invalid %s", async (_description, override) => {
    await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Workshop page", slug: "workshop-page", blocks: baselineBlocks, ...override })
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 400, code: "BAD_REQUEST" });
        expect(typeof body.message).toBe("string");
      });
  });

  it("returns a common conflict envelope for an occupied slug", async () => {
    await createProject();

    await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Second", slug: "workshop-page", blocks: [] })
      .expect(409, {
        statusCode: 409,
        code: "SLUG_CONFLICT",
        message: "That slug is already in use",
        details: { slug: "workshop-page" }
      });
  });

  it("trims project names before persistence", async () => {
    const project = await createProject({ name: "  Workshop page  " });

    expect(project.name).toBe("Workshop page");
  });

  it("returns common not-found and malformed-ID envelopes", async () => {
    await request(app.getHttpServer())
      .get("/api/projects/123e4567-e89b-42d3-a456-426614174000")
      .expect(404, {
        statusCode: 404,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found"
      });

    await request(app.getHttpServer())
      .get("/api/projects/not-a-uuid")
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 400, code: "BAD_REQUEST" });
      });
  });

  it("keeps the 20 block limit in the builder instead of the API", async () => {
    const blocks = Array.from({ length: 21 }, (_, index) => ({
      id: `text-${index}`,
      type: "text",
      text: `Block ${index}`
    }));

    await createProject({ blocks });
  });

  it("publishes and republishes an isolated static document", async () => {
    const first = await createProject();
    const second = await createProject({ name: "Other page", slug: "other-page", blocks: [
      { id: "other", type: "text", text: "Other project content" }
    ] });

    await request(app.getHttpServer())
      .post(`/api/projects/${first.id}/publish`)
      .expect(201)
      .expect(({ body }: { body: { project: ProjectResponse; url: string } }) => {
        expect(body.url).toBe("/sites/workshop-page");
        expect(body.project.publishedAt).not.toBeNull();
      });
    await request(app.getHttpServer())
      .post(`/api/projects/${second.id}/publish`)
      .expect(201);

    await request(app.getHttpServer())
      .get("/sites/workshop-page")
      .expect(200)
      .expect("content-type", /html/)
      .expect("x-content-type-options", "nosniff")
      .expect((response) => {
        expect(response.text).toContain("Original body");
        expect(response.text).not.toContain("Other project content");
      });

    await expect(readdir(config.publishDir)).resolves.toEqual(
      expect.arrayContaining([`${first.id}.html`, `${second.id}.html`])
    );

    await request(app.getHttpServer())
      .put(`/api/projects/${first.id}`)
      .send({ name: first.name, slug: first.slug, blocks: [
        { id: "replacement", type: "text", text: "Replacement body" }
      ] })
      .expect(200);
    await request(app.getHttpServer()).post(`/api/projects/${first.id}/publish`).expect(201);

    await request(app.getHttpServer())
      .get("/sites/workshop-page")
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain("Replacement body");
        expect(response.text).not.toContain("Original body");
      });
  });

  it("invalidates both old and new public slugs until a renamed project is republished", async () => {
    const project = await createProject();
    await request(app.getHttpServer()).post(`/api/projects/${project.id}/publish`).expect(201);
    await request(app.getHttpServer()).get("/sites/workshop-page").expect(200);

    await request(app.getHttpServer())
      .put(`/api/projects/${project.id}`)
      .send({ name: project.name, slug: "renamed-page", blocks: project.blocks })
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body.publishedAt).toBeNull();
      });

    await request(app.getHttpServer()).get("/sites/workshop-page").expect(404);
    await request(app.getHttpServer()).get("/sites/renamed-page").expect(404);

    await request(app.getHttpServer()).post(`/api/projects/${project.id}/publish`).expect(201);
    await request(app.getHttpServer()).get("/sites/renamed-page").expect(200);
    await request(app.getHttpServer()).get("/sites/workshop-page").expect(404);
  });

  it("accepts unsafe URLs at save time and neutralizes them when publishing", async () => {
    const project = await createProject({ blocks: [
      { id: "unsafe", type: "button", label: "Unsafe", url: "javascript:alert(1)" }
    ] });

    await request(app.getHttpServer()).post(`/api/projects/${project.id}/publish`).expect(201);
    await request(app.getHttpServer())
      .get("/sites/workshop-page")
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('aria-disabled="true"');
        expect(response.text).not.toContain("javascript:");
      });
  });

  it("renames a project via PATCH without changing its other fields", async () => {
    const created = await createProject();

    await request(app.getHttpServer())
      .patch(`/api/projects/${created.id}/name`)
      .send({ name: "Renamed page" })
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body.id).toBe(created.id);
        expect(body.name).toBe("Renamed page");
        expect(body.slug).toBe(created.slug);
        expect(body.blocks).toEqual(created.blocks);
      });

    await request(app.getHttpServer())
      .get(`/api/projects/${created.id}`)
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body.name).toBe("Renamed page");
      });
  });

  it("trims a renamed project name before persistence", async () => {
    const created = await createProject();

    await request(app.getHttpServer())
      .patch(`/api/projects/${created.id}/name`)
      .send({ name: "  Renamed page  " })
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body.name).toBe("Renamed page");
      });
  });

  it.each([
    ["empty name", ""],
    ["whitespace-only name", "   "]
  ])("returns the common 400 envelope when renaming with an %s", async (_description, name) => {
    const created = await createProject();

    await request(app.getHttpServer())
      .patch(`/api/projects/${created.id}/name`)
      .send({ name })
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 400, code: "BAD_REQUEST" });
        expect(typeof body.message).toBe("string");
      });
  });

  it("returns the common not-found envelope when renaming an unknown project", async () => {
    await request(app.getHttpServer())
      .patch("/api/projects/123e4567-e89b-42d3-a456-426614174000/name")
      .send({ name: "Renamed page" })
      .expect(404, {
        statusCode: 404,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found"
      });
  });

  it("returns 404 for a site that has not been published", async () => {
    await request(app.getHttpServer())
      .get("/sites/not-published")
      .expect(404)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 404, code: "SITE_NOT_FOUND" });
      });
  });
});
