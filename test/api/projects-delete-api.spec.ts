import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { rm } from "node:fs/promises";
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

describe("project API - delete", () => {
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

  it("returns 400 and does NOT delete the project when confirm is false (AC-2)", async () => {
    const project = await createProject();

    await request(app.getHttpServer())
      .delete(`/api/projects/${project.id}`)
      .send({ confirm: false })
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 400, code: "BAD_REQUEST" });
      });

    // Project must still exist
    await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .expect(200);
  });

  it("returns 400 when no body is sent (AC-2)", async () => {
    const project = await createProject();

    await request(app.getHttpServer())
      .delete(`/api/projects/${project.id}`)
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 400 });
      });

    // Project must still exist
    await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .expect(200);
  });

  it("returns 404 for an unknown project ID with confirm true (AC-4)", async () => {
    await request(app.getHttpServer())
      .delete("/api/projects/123e4567-e89b-42d3-a456-426614174000")
      .send({ confirm: true })
      .expect(404, {
        statusCode: 404,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found"
      });
  });

  it("returns 204 and the project can no longer be loaded after confirmed deletion (AC-3)", async () => {
    const project = await createProject();

    await request(app.getHttpServer())
      .delete(`/api/projects/${project.id}`)
      .send({ confirm: true })
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .expect(404)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 404, code: "PROJECT_NOT_FOUND" });
      });
  });
});
