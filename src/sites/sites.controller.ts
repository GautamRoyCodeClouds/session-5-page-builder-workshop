import { Controller, Get, Header, Param, Res } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiProduces, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { SitesService } from "./sites.service";

const PUBLISHED_CACHE_CONTROL = "public, max-age=60";
const NOT_CACHEABLE_CACHE_CONTROL = "no-store";

@ApiTags("sites")
@Controller("sites")
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get(":slug")
  @Header("content-type", "text/html; charset=utf-8")
  @Header("x-content-type-options", "nosniff")
  @ApiProduces("text/html")
  @ApiOkResponse({ description: "Published HTML document" })
  @ApiNotFoundResponse({ description: "Published site not found" })
  async getSite(
    @Param("slug") slug: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<string> {
    try {
      const html = await this.sites.read(slug);
      response.setHeader("cache-control", PUBLISHED_CACHE_CONTROL);
      return html;
    } catch (error) {
      response.setHeader("cache-control", NOT_CACHEABLE_CACHE_CONTROL);
      throw error;
    }
  }
}
