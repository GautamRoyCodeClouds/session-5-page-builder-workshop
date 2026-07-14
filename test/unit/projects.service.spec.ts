import { ApiException } from "../../src/common/errors/api-exception";
import { ProjectsService } from "../../src/projects/projects.service";
import type { ProjectEntity } from "../../src/projects/project.entity";
import type { ProjectsRepository } from "../../src/projects/projects.repository";
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
      blocks: [],
      publishedAt: null,
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
