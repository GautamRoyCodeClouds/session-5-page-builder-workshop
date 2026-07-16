import { ApiException } from "../../src/common/errors/api-exception";
import type { ProjectEntity } from "../../src/projects/project.entity";
import { ProjectsService } from "../../src/projects/projects.service";
import type { ProjectsRepository } from "../../src/projects/projects.repository";
import type { PublisherService } from "../../src/publisher/publisher.service";

function makeProject(overrides: Partial<ProjectEntity> = {}): ProjectEntity {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Workshop page",
    slug: "workshop-page",
    blocks: [],
    publishedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides
  };
}

describe("ProjectsService.rename", () => {
  it("renames an existing project", async () => {
    const project = makeProject();
    const renamed = makeProject({ name: "Renamed page" });
    const findById = jest.fn().mockResolvedValue(project);
    const rename = jest.fn().mockResolvedValue(renamed);
    const repository = { findById, rename } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await expect(service.rename(project.id, "Renamed page")).resolves.toEqual(renamed);
    expect(rename).toHaveBeenCalledWith(project.id, "Renamed page");
  });

  it("throws the common not-found error for an unknown project", async () => {
    const findById = jest.fn().mockResolvedValue(null);
    const rename = jest.fn();
    const repository = { findById, rename } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await expect(service.rename("missing-id", "Renamed page")).rejects.toThrow(ApiException);
    expect(rename).not.toHaveBeenCalled();
  });
});
