jest.mock("../../src/database/prisma.service", () => ({
  PrismaService: class PrismaService {}
}));

import type { Response } from "express";

import type { PrismaService } from "../../src/database/prisma.service";
import { HealthController, ReadinessController } from "../../src/health/health.controller";

describe("HealthController", () => {
  function createResponse(): jest.Mocked<Pick<Response, "status">> {
    const response = {
      status: jest.fn()
    };
    response.status.mockReturnValue(response);
    return response;
  }

  it("reports ready when the database probe succeeds", async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ "?column?": 1 }]);
    const controller = new ReadinessController({ $queryRaw: queryRaw } as unknown as PrismaService);
    const response = createResponse();

    await expect(controller.getReadiness(response as unknown as Response)).resolves.toEqual({ status: "ready" });
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("reports not-ready without exposing a database error", async () => {
    const queryRaw = jest.fn().mockRejectedValue(new Error("postgres://user:secret@database.internal:5432/session5"));
    const controller = new ReadinessController({ $queryRaw: queryRaw } as unknown as PrismaService);
    const response = createResponse();

    await expect(controller.getReadiness(response as unknown as Response)).resolves.toEqual({ status: "not-ready" });
    expect(response.status).toHaveBeenCalledWith(503);
  });

  it("keeps the liveness response unchanged", () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({ status: "ok" });
  });
});
