import { Injectable } from "@nestjs/common";
import { resolve } from "node:path";

@Injectable()
export class AppConfigService {
  get port(): number {
    const raw = process.env.PORT;
    if (raw === undefined || raw.trim() === "") {
      return 3000;
    }
    const parsed = Number(raw);
    // Guard a malformed PORT (non-numeric, negative, or out of range) so a bad
    // env value falls back to the default instead of crashing app.listen() with
    // an opaque RangeError at boot.
    return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : 3000;
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
