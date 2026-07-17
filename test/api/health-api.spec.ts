import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/database/prisma.service";
import { configureApplication } from "../../src/main";

describe("health API", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it("reports ready when the database probe succeeds and preserves liveness", async () => {
    await request(app.getHttpServer()).get("/ready").expect(200, { status: "ready" });
    await request(app.getHttpServer()).get("/health").expect(200, { status: "ok" });
  });

  it("reports not-ready without exposing database details when the probe fails", async () => {
    jest.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(
      new Error("postgres://user:secret@database.internal:5432/session5")
    );

    await request(app.getHttpServer())
      .get("/ready")
      .expect(503, { status: "not-ready" })
      .expect((response) => {
        expect(response.text).not.toContain("secret");
        expect(response.text).not.toContain("database.internal");
      });
  });
});
