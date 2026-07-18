import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";

import { AppModule } from "../../../src/app.module";
import { configureApplication } from "../../../src/main";
import { PrismaService } from "../../../src/database/prisma.service";

type ProjectResponse = {
  id: string;
  name: string;
  slug: string;
  version: number;
  blocks: unknown[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

describe("create-save-load round trip", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let projectId: string | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    if (projectId) {
      await prisma.project.deleteMany({ where: { id: projectId } });
      projectId = undefined;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates, updates, and reloads a project with the same ordered blocks", async () => {
    const initialBlocks = [
      { id: "heading-1", type: "heading", text: "Round trip", level: 1 },
      { id: "text-1", type: "text", text: "Initial body" }
    ];

    const created = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Round trip page", slug: "round-trip-page", blocks: initialBlocks })
      .expect(201);
    const createdBody = created.body as ProjectResponse;
    projectId = createdBody.id;

    expect(createdBody).toMatchObject({
      name: "Round trip page",
      slug: "round-trip-page",
      blocks: initialBlocks
    });

    const updatedBlocks = [
      { id: "text-1", type: "text", text: "Updated body" },
      { id: "heading-1", type: "heading", text: "Round trip", level: 1 },
      { id: "button-1", type: "button", label: "Open", url: "https://example.com" }
    ];

    await request(app.getHttpServer())
      .put(`/api/projects/${projectId}`)
      .send({ name: "Round trip page", slug: "round-trip-page", blocks: updatedBlocks, version: createdBody.version })
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body.blocks).toEqual(updatedBlocks);
      });

    await request(app.getHttpServer())
      .get(`/api/projects/${projectId}`)
      .expect(200)
      .expect(({ body }: { body: ProjectResponse }) => {
        expect(body.name).toBe("Round trip page");
        expect(body.slug).toBe("round-trip-page");
        expect(body.blocks).toEqual(updatedBlocks);
        expect((body.blocks as Array<{ id: string }>).map((block) => block.id)).toEqual([
          "text-1",
          "heading-1",
          "button-1"
        ]);
      });
  });
});
