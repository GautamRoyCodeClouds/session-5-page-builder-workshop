import { normalizeException } from "../../src/common/errors/api-exception";
import type { ProjectEntity } from "../../src/projects/project.entity";
import type { ProjectsRepository } from "../../src/projects/projects.repository";
import { ProjectsService } from "../../src/projects/projects.service";
import type { PublisherService } from "../../src/publisher/publisher.service";

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
      blocks: [],
      publishedAt,
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
