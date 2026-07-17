import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";

jest.mock("../../src/database/prisma.service", () => ({
  PrismaService: class PrismaService {}
}));

import { AppModule } from "../../src/app.module";
import { createOpenApiDocument } from "../../src/main";

describe("OpenAPI document", () => {
  it("documents discriminated blocks and project request/success schemas", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication<NestExpressApplication>();
    const document = createOpenApiDocument(app);

    expect(document.paths["/api/projects"]?.post).toMatchObject({
      requestBody: {
        content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectInputDto" } } }
      },
      responses: {
        201: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectResponseDto" } } }
        }
      }
    });
    expect(document.paths["/api/projects/{id}"]?.get?.responses).toMatchObject({
      200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectResponseDto" } } } }
    });
    expect(document.paths["/api/projects/{id}"]?.put).toMatchObject({
      requestBody: {
        content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectInputDto" } } }
      },
      responses: {
        200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectResponseDto" } } } }
      }
    });
    expect(document.paths["/api/projects/{id}/publish"]?.post?.responses).toMatchObject({
      201: { content: { "application/json": { schema: { $ref: "#/components/schemas/PublishResponseDto" } } } }
    });
    expect(document.paths["/api/projects/{id}/duplicate"]?.post?.responses).toMatchObject({
      201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectResponseDto" } } } }
    });

    const schemas = document.components?.schemas as Record<string, {
      properties?: Record<string, unknown>;
    }>;
    expect(schemas.ProjectInputDto.properties?.blocks).toMatchObject({
      type: "array",
      items: {
        discriminator: {
          propertyName: "type",
          mapping: {
            heading: "#/components/schemas/HeadingBlockDto",
            text: "#/components/schemas/TextBlockDto",
            button: "#/components/schemas/ButtonBlockDto",
            section: "#/components/schemas/SectionBlockDto",
            divider: "#/components/schemas/DividerBlockDto",
            quote: "#/components/schemas/QuoteBlockDto"
          }
        },
        oneOf: [
          { $ref: "#/components/schemas/HeadingBlockDto" },
          { $ref: "#/components/schemas/TextBlockDto" },
          { $ref: "#/components/schemas/ButtonBlockDto" },
          { $ref: "#/components/schemas/SectionBlockDto" },
          { $ref: "#/components/schemas/DividerBlockDto" },
          { $ref: "#/components/schemas/QuoteBlockDto" }
        ]
      }
    });

    await moduleRef.close();
  });
});
