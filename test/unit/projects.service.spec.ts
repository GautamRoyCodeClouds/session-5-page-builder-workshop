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

describe("ProjectsService.list", () => {
  it("defaults to page 1 with a page size of 20", async () => {
    const items = [makeProject()];
    const list = jest.fn().mockResolvedValue({ items, total: 1 });
    const repository = { list } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await expect(service.list({})).resolves.toEqual({ items, page: 1, pageSize: 20, total: 1 });
    expect(list).toHaveBeenCalledWith(1, 20);
  });

  it("forwards an explicit page and pageSize", async () => {
    const list = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const repository = { list } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await service.list({ page: 3, pageSize: 5 });

    expect(list).toHaveBeenCalledWith(3, 5);
  });
});
