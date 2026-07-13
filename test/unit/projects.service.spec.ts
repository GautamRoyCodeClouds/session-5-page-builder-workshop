jest.mock("../../src/projects/projects.repository", () => ({
  ProjectsRepository: class ProjectsRepository {}
}));

import { ApiException } from "../../src/common/errors/api-exception";
import type { ProjectEntity } from "../../src/projects/project.entity";
import type { ProjectsRepository } from "../../src/projects/projects.repository";
import { ProjectsService } from "../../src/projects/projects.service";
import type { PublisherService } from "../../src/publisher/publisher.service";

describe("ProjectsService.rename", () => {
  const projectId = "123e4567-e89b-42d3-a456-426614174000";
  let project: ProjectEntity;

  beforeEach(() => {
    project = {
      id: projectId,
      name: "Original name",
      slug: "original-slug",
      blocks: [{ id: "body", type: "text", text: "Body" }],
      publishedAt: new Date(),
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
