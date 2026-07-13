import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { configureApplication } from "../../src/main";
import { PrismaService } from "../../src/database/prisma.service";

describe("project rename endpoint", () => {
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

  async function createProject(): Promise<{ id: string; slug: string }> {
    const response = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Workshop page", slug: "workshop-page", blocks: [] })
      .expect(201);
    return response.body as { id: string; slug: string };
  }

  it("returns 200 with the new name for a valid nonblank name", async () => {
    const project = await createProject();

    const response = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/name`)
      .send({ name: "Renamed page" })
      .expect(200);

    expect(response.body).toMatchObject({ id: project.id, slug: project.slug, name: "Renamed page" });
  });

  it("returns 400 for a blank name", async () => {
    const project = await createProject();

    await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/name`)
      .send({ name: "" })
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 400, code: "BAD_REQUEST" });
      });
  });

  it("returns 400 for a whitespace-only name", async () => {
    const project = await createProject();

    await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/name`)
      .send({ name: "   " })
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ statusCode: 400, code: "BAD_REQUEST" });
      });
  });

  it("returns the existing not-found envelope for an unknown project", async () => {
    const unknown = "123e4567-e89b-42d3-a456-426614174000";

    await request(app.getHttpServer())
      .patch(`/api/projects/${unknown}/name`)
      .send({ name: "Renamed page" })
      .expect(404, {
        statusCode: 404,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found"
      });
  });
});
