import { Controller, Get, Res } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { PrismaService } from "../database/prisma.service";

type ReadinessResponse = { status: "ready" | "not-ready" };

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({ description: "Application is live" })
  getHealth(): { status: "ok" } {
    return { status: "ok" };
  }
}

@ApiTags("health")
@Controller()
export class ReadinessController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("ready")
  @ApiOkResponse({ description: "Application and database are ready" })
  @ApiServiceUnavailableResponse({ description: "Database is not ready" })
  async getReadiness(@Res({ passthrough: true }) response: Response): Promise<ReadinessResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch {
      response.status(503);
      return { status: "not-ready" };
    }
  }
}
