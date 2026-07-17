jest.mock("../../src/projects/projects.repository", () => ({
  ProjectsRepository: class ProjectsRepository {}
}));

import { ApiException, normalizeException } from "../../src/common/errors/api-exception";
import type { ProjectEntity } from "../../src/projects/project.entity";
import type { ProjectsRepository } from "../../src/projects/projects.repository";
import { ProjectsService } from "../../src/projects/projects.service";
import type { PublisherService } from "../../src/publisher/publisher.service";
import type { ProjectDocument } from "../../src/publisher/project-document";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let repository: jest.Mocked<Pick<ProjectsRepository, "findById" | "delete">>;
  let publisher: jest.Mocked<Pick<PublisherService, "publish">>;

  beforeEach(() => {
    repository = {
      findById: jest.fn<Promise<ProjectEntity | null>, [string]>(),
      delete: jest.fn<Promise<void>, [string]>()
    };

    publisher = { publish: jest.fn<Promise<string>, [ProjectDocument]>() };
    service = new ProjectsService(repository as unknown as ProjectsRepository, publisher as unknown as PublisherService);
  });

  it("rejects delete confirmation when confirm is false", async () => {
    await expect(service.delete("project-id", { confirm: false }))
      .rejects.toThrow(ApiException);

    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("deletes an existing project when confirmation is true", async () => {
    const project: ProjectEntity = {
      id: "project-id",
      name: "Page",
      slug: "page",
      description: null,
      textColor: null,
      buttonColor: null,
      blocks: [],
      publishedAt: null,
      lastSuccessfulPublishAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    repository.findById.mockResolvedValueOnce(project);
    repository.delete.mockResolvedValueOnce();

    await service.delete(project.id, { confirm: true });

    expect(repository.delete).toHaveBeenCalledWith(project.id);
  });

  it("throws not-found when deleting an unknown project", async () => {
    repository.findById.mockResolvedValueOnce(null);

    await expect(service.delete("missing-id", { confirm: true }))
      .rejects.toThrow(ApiException);

    expect(repository.delete).not.toHaveBeenCalled();
  });
});

describe("ProjectsService.rename", () => {
  const projectId = "123e4567-e89b-42d3-a456-426614174000";
  let project: ProjectEntity;

  beforeEach(() => {
    project = {
      id: projectId,
      name: "Original name",
      slug: "original-slug",
      description: null,
      textColor: null,
      buttonColor: null,
      blocks: [{ id: "body", type: "text", text: "Body" }],
      publishedAt: new Date(),
      lastSuccessfulPublishAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  it("renames an existing project through a name-only repository update", async () => {
    const renamed = { ...project, name: "New name" };
    const updateName = jest.fn().mockResolvedValue(renamed);
    const repository = {
      findById: jest.fn().mockResolvedValue(project),
      updateName
    } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await expect(service.rename(projectId, "New name")).resolves.toBe(renamed);
    expect(updateName).toHaveBeenCalledWith(projectId, "New name");
  });

  it("throws the common not-found envelope for an unknown project without updating", async () => {
    const updateName = jest.fn();
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      updateName
    } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    const error = await service.rename(projectId, "New name").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiException);
    expect((error as ApiException).getStatus()).toBe(404);
    expect((error as ApiException).getResponse()).toEqual({
      statusCode: 404,
      code: "PROJECT_NOT_FOUND",
      message: "Project not found"
    });
    expect(updateName).not.toHaveBeenCalled();
  });
});

describe("ProjectsService.duplicate", () => {
  const projectId = "123e4567-e89b-42d3-a456-426614174000";
  const source: ProjectEntity = {
    id: projectId,
    name: "Workshop page",
    slug: "workshop-page",
    description: null,
    textColor: null,
    buttonColor: null,
    blocks: [
      { id: "heading-1", type: "heading", text: "Welcome", level: 1 },
      { id: "text-1", type: "text", text: "Body" }
    ],
    publishedAt: new Date(),
    lastSuccessfulPublishAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it("copies a project through create with a new available slug", async () => {
    const copy = { ...source, id: "223e4567-e89b-42d3-a456-426614174000", slug: "workshop-page-copy", publishedAt: null };
    const create = jest.fn().mockResolvedValue(copy);
    const repository = {
      findById: jest.fn().mockResolvedValue(source),
      findBySlug: jest.fn().mockResolvedValue(null),
      create
    } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await expect(service.duplicate(projectId)).resolves.toBe(copy);
    expect(create).toHaveBeenCalledWith({
      name: source.name,
      slug: "workshop-page-copy",
      description: null,
      textColor: null,
      buttonColor: null,
      blocks: source.blocks
    });
  });

  it("uses the next copy slug when the first candidate is occupied", async () => {
    const create = jest.fn().mockResolvedValue(source);
    const repository = {
      findById: jest.fn().mockResolvedValue(source),
      findBySlug: jest.fn((slug: string) => Promise.resolve(slug === "workshop-page-copy" ? source : null)),
      create
    } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await service.duplicate(projectId);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ slug: "workshop-page-copy-2" }));
  });

  it("throws the common not-found error without creating a copy", async () => {
    const create = jest.fn();
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      create
    } as unknown as ProjectsRepository;
    const service = new ProjectsService(repository, {} as PublisherService);

    await expect(service.duplicate(projectId)).rejects.toThrow(ApiException);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("ProjectsService.getStatus", () => {
  const projectId = "123e4567-e89b-42d3-a456-426614174000";

  function makeService(project: ProjectEntity | null): ProjectsService {
    const repository = {
      findById: (id: string): Promise<ProjectEntity | null> =>
        Promise.resolve(id === projectId ? project : null)
    } as ProjectsRepository;
    return new ProjectsService(repository, {} as PublisherService);
  }

  function makeProject(publishedAt: Date | null): ProjectEntity {
    return {
      id: projectId,
      name: "Workshop page",
      slug: "workshop-page",
      description: null,
      textColor: null,
      buttonColor: null,
      blocks: [],
      publishedAt,
      lastSuccessfulPublishAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  it("reports draft status with a null publishedAt before any publish", async () => {
    const service = makeService(makeProject(null));

    await expect(service.getStatus(projectId)).resolves.toEqual({
      id: projectId,
      status: "draft",
      publishedAt: null
    });
  });

  it("reports published status with the current timestamp", async () => {
    const publishedAt = new Date();
    const service = makeService(makeProject(publishedAt));

    await expect(service.getStatus(projectId)).resolves.toEqual({
      id: projectId,
      status: "published",
      publishedAt
    });
  });

  it("throws the common not-found error for an unknown project", async () => {
    const service = makeService(null);
    const error = await service.getStatus(projectId).catch((caught: unknown) => caught);

    expect(normalizeException(error)).toEqual({
      statusCode: 404,
      code: "PROJECT_NOT_FOUND",
      message: "Project not found"
    });
  });
});
