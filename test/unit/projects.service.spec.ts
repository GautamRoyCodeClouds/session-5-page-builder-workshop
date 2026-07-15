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

function makeListService(list: (page: number, pageSize: number) => Promise<{ items: ProjectEntity[]; total: number }>): ProjectsService {
  const repository = { list } as unknown as ProjectsRepository;
  return new ProjectsService(repository, {} as PublisherService);
}

describe("ProjectsService.list", () => {
  it("defaults to page 1 and a page size of 20 when no params are given", async () => {
    const list = jest.fn(() => Promise.resolve({ items: [baseProject], total: 1 }));
    const service = makeListService(list);

    await expect(service.list(undefined, undefined)).resolves.toEqual({
      items: [baseProject],
      page: 1,
      pageSize: 20,
      total: 1
    });
    expect(list).toHaveBeenCalledWith(1, 20);
  });

  it("passes through valid explicit page and pageSize values", async () => {
    const list = jest.fn(() => Promise.resolve({ items: [], total: 0 }));
    const service = makeListService(list);

    await expect(service.list("3", "10")).resolves.toMatchObject({ page: 3, pageSize: 10 });
    expect(list).toHaveBeenCalledWith(3, 10);
  });

  it("caps pageSize at 50 even when a larger value is requested", async () => {
    const list = jest.fn(() => Promise.resolve({ items: [], total: 0 }));
    const service = makeListService(list);

    await expect(service.list(undefined, "500")).resolves.toMatchObject({ pageSize: 50 });
    expect(list).toHaveBeenCalledWith(1, 50);
  });

  it.each(["0", "-1", "1.5", "abc", ""])("throws 400 for a nonpositive or noninteger page %s", async (page) => {
    const service = makeListService(() => Promise.resolve({ items: [], total: 0 }));
    const error = await service.list(page, undefined).catch((e: unknown) => e);
    expect(normalizeException(error)).toMatchObject({ statusCode: HttpStatus.BAD_REQUEST, code: "BAD_REQUEST" });
  });

  it.each(["0", "-1", "1.5", "abc"])("throws 400 for a nonpositive or noninteger pageSize %s", async (pageSize) => {
    const service = makeListService(() => Promise.resolve({ items: [], total: 0 }));
    const error = await service.list(undefined, pageSize).catch((e: unknown) => e);
    expect(normalizeException(error)).toMatchObject({ statusCode: HttpStatus.BAD_REQUEST, code: "BAD_REQUEST" });
  });
});
