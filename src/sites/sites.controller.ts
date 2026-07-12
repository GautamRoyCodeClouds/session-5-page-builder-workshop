import { Controller, Get, Header, Param } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiProduces, ApiTags } from "@nestjs/swagger";

import { SitesService } from "./sites.service";

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
  getSite(@Param("slug") slug: string): Promise<string> {
    return this.sites.read(slug);
  }
}
