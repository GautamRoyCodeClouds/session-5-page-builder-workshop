import "dotenv/config";
import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { resolve } from "node:path";

import { AppModule } from "./app.module";
import { AppConfigService } from "./common/config/app-config.service";
import { ApiExceptionFilter } from "./common/errors/api-exception.filter";

export function createOpenApiDocument(app: NestExpressApplication): OpenAPIObject {
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Session 5 Page Builder API")
      .setDescription("Create, save, load, and publish workshop pages.")
      .setVersion("1.0")
      .build()
  );
}

export function configureApplication(app: NestExpressApplication): void {
  app.useStaticAssets(resolve(process.cwd(), "public"));
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }));
  app.useGlobalFilters(new ApiExceptionFilter());

  SwaggerModule.setup("api/docs", app, createOpenApiDocument(app), {
    raw: ["json"],
    jsonDocumentUrl: "/api/openapi.json"
  });
}

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApplication(app);
  await app.listen(app.get(AppConfigService).port);
}

if (require.main === module) {
  void bootstrap();
}
