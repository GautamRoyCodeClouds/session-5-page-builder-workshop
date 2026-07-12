import { Module } from "@nestjs/common";

import { ConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { ProjectsModule } from "./projects/projects.module";
import { PublisherModule } from "./publisher/publisher.module";
import { SitesModule } from "./sites/sites.module";
import { AppController } from "./app.controller";

@Module({
  imports: [ConfigModule, DatabaseModule, PublisherModule, HealthModule, ProjectsModule, SitesModule],
  controllers: [AppController]
})
export class AppModule {}
