import type { ProjectEntity } from "../../src/projects/project.entity";
import { ProjectsService } from "../../src/projects/projects.service";

class FakeProjectsRepository {
  findBySlugCalls = 0;
  private readonly bySlug = new Map<string, ProjectEntity>();

  seedSlug(slug: string): void {
    this.bySlug.set(slug, { slug } as ProjectEntity);
  }

  findBySlug(slug: string): Promise<ProjectEntity | null> {
    this.findBySlugCalls += 1;
    return Promise.resolve(this.bySlug.get(slug) ?? null);
  }
}

describe("ProjectsService.isSlugAvailable", () => {
  function createService(): { repository: FakeProjectsRepository; service: ProjectsService } {
    const repository = new FakeProjectsRepository();
    const publisher = { publish: jest.fn() };
    const service = new ProjectsService(repository as never, publisher as never);
    return { repository, service };
  }

  it("reports an unused slug as available", async () => {
    const { service } = createService();

    await expect(service.isSlugAvailable("free-slug")).resolves.toBe(true);
  });

  it("reports a slug owned by an existing project as unavailable", async () => {
    const { repository, service } = createService();
    repository.seedSlug("workshop-page");

    await expect(service.isSlugAvailable("workshop-page")).resolves.toBe(false);
  });

  it("only reads and never writes when checking availability", async () => {
    // The fake repository exposes findBySlug alone, so any create/update/delete
    // call would throw "not a function" and fail this test.
    const { repository, service } = createService();

    await expect(service.isSlugAvailable("workshop-page")).resolves.toBe(true);
    expect(repository.findBySlugCalls).toBe(1);
  });
});
