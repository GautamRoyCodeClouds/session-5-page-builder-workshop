import { Injectable } from "@nestjs/common";
import { resolve } from "node:path";

@Injectable()
export class AppConfigService {
  get port(): number {
    return Number(process.env.PORT ?? "3000");
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL
      ?? "postgresql://session5:session5@127.0.0.1:54329/session5?schema=public";
  }

  get publishDir(): string {
    return resolve(process.cwd(), process.env.PUBLISH_DIR ?? ".data/published");
  }

  get siteLanguage(): string {
    return process.env.SITE_LANGUAGE ?? "en";
  }
}
