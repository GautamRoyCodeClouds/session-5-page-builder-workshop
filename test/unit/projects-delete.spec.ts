import { ApiException } from "../../src/common/errors/api-exception";
import type { ProjectEntity } from "../../src/projects/project.entity";
import { ProjectsService } from "../../src/projects/projects.service";

const EXISTING_ID = "11111111-1111-4111-8111-111111111111";
const UNKNOWN_ID = "99999999-9999-4999-8999-999999999999";

class FakeProjectsRepository {
  readonly deleted: string[] = [];
  private readonly byId = new Map<string, ProjectEntity>();

  seed(project: ProjectEntity): void {
    this.byId.set(project.id, project);
  }

  findById(id: string): Promise<ProjectEntity | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  delete(id: string): Promise<void> {
    this.deleted.push(id);
    this.byId.delete(id);
    return Promise.resolve();
  }
}

function buildProject(): ProjectEntity {
  return {
    id: EXISTING_ID,
    name: "Workshop page",
    slug: "workshop-page",
    description: null,
    blocks: [{ id: "t", type: "text", text: "Body" }],
    publishedAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0)
  };
}

describe("ProjectsService.delete", () => {
  function createService(): { repository: FakeProjectsRepository; service: ProjectsService } {
    const repository = new FakeProjectsRepository();
    const publisher = { publish: jest.fn() };
    const service = new ProjectsService(repository as never, publisher as never);
    return { repository, service };
  }

  it("removes only the confirmed target project", async () => {
    const { repository, service } = createService();
    repository.seed(buildProject());

    await expect(service.delete(EXISTING_ID, true)).resolves.toBeUndefined();

    expect(repository.deleted).toEqual([EXISTING_ID]);
    await expect(service.delete(EXISTING_ID, true)).rejects.toBeInstanceOf(ApiException);
  });

  it("rejects an unconfirmed deletion without touching data", async () => {
    const { repository, service } = createService();
    repository.seed(buildProject());

    await expect(service.delete(EXISTING_ID, false)).rejects.toBeInstanceOf(ApiException);
    expect(repository.deleted).toEqual([]);
  });

  it("rejects deletion of an unknown project", async () => {
    const { repository, service } = createService();

    await expect(service.delete(UNKNOWN_ID, true)).rejects.toBeInstanceOf(ApiException);
    expect(repository.deleted).toEqual([]);
  });
});
