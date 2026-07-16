import { HttpStatus } from "@nestjs/common";

jest.mock("../../src/projects/projects.repository", () => ({
  ProjectsRepository: class ProjectsRepository {}
}));
jest.mock("../../src/publisher/publisher.service", () => ({
  PublisherService: class PublisherService {}
}));

import { normalizeException } from "../../src/common/errors/api-exception";
import type { ProjectEntity } from "../../src/projects/project.entity";
import type { ProjectsRepository } from "../../src/projects/projects.repository";
import type { PublisherService } from "../../src/publisher/publisher.service";
import { ProjectsService } from "../../src/projects/projects.service";

const baseProject: ProjectEntity = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  name: "Test page",
  slug: "test-page",
  blocks: [],
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

function makeService(findBySlug: (slug: string) => Promise<ProjectEntity | null>): ProjectsService {
  const repository = { findBySlug } as unknown as ProjectsRepository;
  const publisher = {} as PublisherService;
  return new ProjectsService(repository, publisher);
}

describe("ProjectsService.checkSlugAvailability", () => {
  it("returns available true for a slug not in use", async () => {
    const service = makeService(() => Promise.resolve(null));
    await expect(service.checkSlugAvailability("free-slug")).resolves.toEqual({ available: true });
  });

  it("returns available false for a slug already taken", async () => {
    const service = makeService(() => Promise.resolve(baseProject));
    await expect(service.checkSlugAvailability("test-page")).resolves.toEqual({ available: false });
  });

  it("throws 400 for a malformed slug", async () => {
    const service = makeService(() => Promise.resolve(null));
    const error = await service.checkSlugAvailability("INVALID_SLUG!").catch((e: unknown) => e);
    expect(normalizeException(error)).toMatchObject({ statusCode: HttpStatus.BAD_REQUEST, code: "BAD_REQUEST" });
  });

  it("throws 400 when slug is missing", async () => {
    const service = makeService(() => Promise.resolve(null));
    const error = await service.checkSlugAvailability(undefined).catch((e: unknown) => e);
    expect(normalizeException(error)).toMatchObject({ statusCode: HttpStatus.BAD_REQUEST, code: "BAD_REQUEST" });
  });
});
