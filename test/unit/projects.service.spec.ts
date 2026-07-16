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

function makeRenameService(overrides: Partial<ProjectsRepository> = {}): ProjectsService {
  const repository = {
    findById: () => Promise.resolve(baseProject),
    rename: (_id: string, name: string) => Promise.resolve({ ...baseProject, name }),
    ...overrides
  } as unknown as ProjectsRepository;
  return new ProjectsService(repository, {} as PublisherService);
}

describe("ProjectsService.rename", () => {
  it("returns the project with the updated name", async () => {
    const service = makeRenameService();
    await expect(service.rename(baseProject.id, "Updated Name")).resolves.toMatchObject({ name: "Updated Name" });
  });

  it("throws 404 for an unknown project", async () => {
    const service = makeRenameService({ findById: () => Promise.resolve(null) });
    const error = await service.rename(baseProject.id, "Any Name").catch((e: unknown) => e);
    expect(normalizeException(error)).toMatchObject({ statusCode: HttpStatus.NOT_FOUND, code: "PROJECT_NOT_FOUND" });
  });
});
