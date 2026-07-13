import { HttpStatus } from "@nestjs/common";

import { ApiException } from "../../src/common/errors/api-exception";
import { ProjectsRepository } from "../../src/projects/projects.repository";
import { ProjectsService } from "../../src/projects/projects.service";
import { PublisherService } from "../../src/publisher/publisher.service";
import type { ProjectEntity } from "../../src/projects/project.entity";

const mockProject: ProjectEntity = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  name: "Test page",
  slug: "test-page",
  blocks: [],
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

function makeService() {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    update: jest.fn(),
    markPublished: jest.fn(),
    delete: jest.fn()
  } as unknown as ProjectsRepository;

  const publisher = {
    publish: jest.fn()
  } as unknown as PublisherService;

  const service = new ProjectsService(repository, publisher);
  return { service, repository };
}

describe("ProjectsService.delete", () => {
  it("throws 400 BAD_REQUEST when confirm is false — repository is never called", async () => {
    const { service, repository } = makeService();

    await expect(service.delete(mockProject.id, false)).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST
    });

    expect((repository.delete as jest.Mock)).not.toHaveBeenCalled();
  });

  it("throws 400 BAD_REQUEST when confirm is false (with project present) — no deletion", async () => {
    const { service, repository } = makeService();
    (repository.findById as jest.Mock).mockResolvedValue(mockProject);

    await expect(service.delete(mockProject.id, false)).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST
    });

    expect((repository.delete as jest.Mock)).not.toHaveBeenCalled();
  });

  it("throws 404 PROJECT_NOT_FOUND when confirm is true but project does not exist", async () => {
    const { service, repository } = makeService();
    (repository.findById as jest.Mock).mockResolvedValue(null);

    const error = await service.delete(mockProject.id, true).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiException);
    expect((error as ApiException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect((error as ApiException).getResponse()).toMatchObject({ code: "PROJECT_NOT_FOUND" });

    expect((repository.delete as jest.Mock)).not.toHaveBeenCalled();
  });

  it("resolves void and calls repository.delete once when confirm is true and project exists", async () => {
    const { service, repository } = makeService();
    (repository.findById as jest.Mock).mockResolvedValue(mockProject);
    (repository.delete as jest.Mock).mockResolvedValue(undefined);

    await expect(service.delete(mockProject.id, true)).resolves.toBeUndefined();

    expect((repository.delete as jest.Mock)).toHaveBeenCalledTimes(1);
    expect((repository.delete as jest.Mock)).toHaveBeenCalledWith(mockProject.id);
  });
});
