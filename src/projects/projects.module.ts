import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module";
import { PublisherModule } from "../publisher/publisher.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsRepository } from "./projects.repository";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [DatabaseModule, PublisherModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService],
  exports: [ProjectsRepository]
})
export class ProjectsModule {}
