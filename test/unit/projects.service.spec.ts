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

describe("ProjectsService.duplicate", () => {
  it("copies the source blocks in order under a nonconflicting slug", async () => {
    const source = makeProject({
      blocks: [
        { id: "heading-1", type: "heading", text: "Welcome", level: 1 },
        { id: "text-1", type: "text", text: "Body" }
      ]
    });
    const copy = makeProject({ id: "8b3a9c34-9b8e-4b6f-8a20-3f6a9d9e6a1a", slug: "workshop-page-copy" });
    const findById = jest.fn().mockResolvedValue(source);
    const findBySlug = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue(copy);
    const repository = { findById, findBySlug, create } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await expect(service.duplicate(source.id)).resolves.toEqual(copy);
    expect(create).toHaveBeenCalledWith({
      name: source.name,
      slug: "workshop-page-copy",
      blocks: source.blocks
    });
  });

  it("appends a numeric suffix until it finds an unused slug", async () => {
    const source = makeProject();
    const copy = makeProject({ slug: "workshop-page-copy-2" });
    const findById = jest.fn().mockResolvedValue(source);
    const findBySlug = jest.fn()
      .mockResolvedValueOnce(makeProject({ slug: "workshop-page-copy" }))
      .mockResolvedValueOnce(null);
    const create = jest.fn().mockResolvedValue(copy);
    const repository = { findById, findBySlug, create } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await service.duplicate(source.id);

    expect(create).toHaveBeenCalledWith({
      name: source.name,
      slug: "workshop-page-copy-2",
      blocks: source.blocks
    });
  });

  it("throws the common not-found error for an unknown source project", async () => {
    const findById = jest.fn().mockResolvedValue(null);
    const create = jest.fn();
    const repository = { findById, create } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await expect(service.duplicate("missing-id")).rejects.toThrow(ApiException);
    expect(create).not.toHaveBeenCalled();
  });
});
