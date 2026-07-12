import { Module } from "@nestjs/common";

import { ConfigModule } from "../common/config/config.module";
import { PublisherService } from "./publisher.service";

@Module({
  imports: [ConfigModule],
  providers: [PublisherService],
  exports: [PublisherService]
})
export class PublisherModule {}
