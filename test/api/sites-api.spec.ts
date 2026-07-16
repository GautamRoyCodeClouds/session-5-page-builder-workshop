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
};

describe("sites API", () => {
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

  async function createAndPublishProject(slug: string): Promise<ProjectResponse> {
    const created = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Cache header page", slug, blocks: [{ id: "text-1", type: "text", text: "Body" }] })
      .expect(201);
    const project = created.body as ProjectResponse;
    await request(app.getHttpServer()).post(`/api/projects/${project.id}/publish`).expect(201);
    return project;
  }

  it("returns a cacheable Cache-Control header for a published page", async () => {
    await createAndPublishProject("cache-header-published");

    await request(app.getHttpServer())
      .get("/sites/cache-header-published")
      .expect(200)
      .expect("cache-control", "public, max-age=60");
  });

  it("returns a non-cacheable Cache-Control header for an unpublished slug", async () => {
    await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Draft page", slug: "cache-header-draft", blocks: [] })
      .expect(201);

    await request(app.getHttpServer())
      .get("/sites/cache-header-draft")
      .expect(404)
      .expect("cache-control", "no-store");
  });

  it("returns a non-cacheable Cache-Control header for a missing slug", async () => {
    await request(app.getHttpServer())
      .get("/sites/does-not-exist")
      .expect(404)
      .expect("cache-control", "no-store");
  });

  it("keeps the existing Cache-Control behavior for API project responses", async () => {
    const project = await createAndPublishProject("cache-header-api-check");

    const response = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .expect(200);

    expect(response.headers["cache-control"]).toBeUndefined();
  });
});
