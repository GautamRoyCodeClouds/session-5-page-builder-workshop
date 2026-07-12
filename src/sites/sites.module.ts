import { Module } from "@nestjs/common";

import { ConfigModule } from "../common/config/config.module";
import { ProjectsModule } from "../projects/projects.module";
import { SitesController } from "./sites.controller";
import { SitesService } from "./sites.service";

@Module({
  imports: [ConfigModule, ProjectsModule],
  controllers: [SitesController],
  providers: [SitesService]
})
export class SitesModule {}
