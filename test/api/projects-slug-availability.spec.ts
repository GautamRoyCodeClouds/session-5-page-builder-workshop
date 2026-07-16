import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { configureApplication } from "../../src/main";
import { PrismaService } from "../../src/database/prisma.service";

type ProjectResponse = {
  id: string;
  updatedAt: string;
};

describe("slug availability API", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.project.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createProject(): Promise<ProjectResponse> {
    const response = await request(app.getHttpServer())
      .post("/api/projects")
      .send({
        name: "Workshop page",
        slug: "workshop-page",
        blocks: [{ id: "text-1", type: "text", text: "Body" }]
      })
      .expect(201);
    return response.body as ProjectResponse;
  }

  it("reports an unclaimed valid slug as available", async () => {
    await request(app.getHttpServer())
      .get("/api/projects/slug-availability")
      .query({ slug: "valid-name" })
      .expect(200, { slug: "valid-name", available: true });
  });

  it("reports a slug owned by an existing project as unavailable", async () => {
    await createProject();

    await request(app.getHttpServer())
      .get("/api/projects/slug-availability")
      .query({ slug: "workshop-page" })
      .expect(200, { slug: "workshop-page", available: false });
  });

  it.each([
    ["missing slug", undefined],
    ["empty slug", ""],
    ["uppercase slug", "Not-Lowercase"],
    ["slug with unsafe characters", "../escape"],
    ["slug longer than 80 characters", "a".repeat(81)]
  ])("returns the common 400 envelope for a %s", async (_description, slug) => {
    await request(app.getHttpServer())
      .get("/api/projects/slug-availability")
      .query(slug === undefined ? {} : { slug })
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 400, code: "BAD_REQUEST" });
        expect(typeof body.message).toBe("string");
      });
  });

  it("creates and updates no project records", async () => {
    const created = await createProject();

    await request(app.getHttpServer())
      .get("/api/projects/slug-availability")
      .query({ slug: "workshop-page" })
      .expect(200);
    await request(app.getHttpServer())
      .get("/api/projects/slug-availability")
      .query({ slug: "another-name" })
      .expect(200);

    await expect(prisma.project.count()).resolves.toBe(1);
    await request(app.getHttpServer())
      .get(`/api/projects/${created.id}`)
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body.updatedAt).toBe(created.updatedAt);
      });
  });

  it("keeps loading projects by ID despite the literal route segment", async () => {
    const created = await createProject();

    await request(app.getHttpServer()).get(`/api/projects/${created.id}`).expect(200);
    await request(app.getHttpServer()).get("/api/projects/not-a-uuid").expect(400);
  });
});
