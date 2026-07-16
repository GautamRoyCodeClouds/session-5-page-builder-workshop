import { ApiException } from "../../src/common/errors/api-exception";
import type { EditableProject, ProjectEntity } from "../../src/projects/project.entity";
import { ProjectsService } from "../../src/projects/projects.service";

class FakeProjectsRepository {
  private readonly byId = new Map<string, ProjectEntity>();
  private readonly bySlug = new Map<string, ProjectEntity>();
  private sequence = 0;

  seed(project: ProjectEntity): void {
    this.byId.set(project.id, project);
    this.bySlug.set(project.slug, project);
  }

  findById(id: string): Promise<ProjectEntity | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  findBySlug(slug: string): Promise<ProjectEntity | null> {
    return Promise.resolve(this.bySlug.get(slug) ?? null);
  }

  create(input: EditableProject): Promise<ProjectEntity> {
    this.sequence += 1;
    const created: ProjectEntity = {
      id: `generated-${this.sequence}`,
      name: input.name,
      slug: input.slug,
      description: input.description,
      blocks: input.blocks,
      publishedAt: null,
      createdAt: new Date(0),
      updatedAt: new Date(0)
    };
    this.seed(created);
    return Promise.resolve(created);
  }
}

function buildSource(overrides: Partial<ProjectEntity> = {}): ProjectEntity {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Workshop page",
    slug: "workshop-page",
    description: null,
    blocks: [
      { id: "heading-1", type: "heading", text: "Welcome", level: 1 },
      { id: "text-1", type: "text", text: "Original body" },
      { id: "button-1", type: "button", label: "Open", url: "https://example.com" },
      { id: "section-1", type: "section", title: "Details" }
    ],
    publishedAt: new Date(0),
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides
  };
}

describe("ProjectsService.duplicate", () => {
  function createService(): { repository: FakeProjectsRepository; service: ProjectsService } {
    const repository = new FakeProjectsRepository();
    const publisher = { publish: jest.fn() };
    const service = new ProjectsService(repository as never, publisher as never);
    return { repository, service };
  }

  it("copies blocks in order into an unpublished project with a new identity", async () => {
    const { repository, service } = createService();
    const source = buildSource();
    repository.seed(source);

    const copy = await service.duplicate(source.id);

    expect(copy.id).not.toBe(source.id);
    expect(copy.blocks).toEqual(source.blocks);
    expect(copy.publishedAt).toBeNull();
  });

  it("gives the copy a nonconflicting slug derived from the source", async () => {
    const { repository, service } = createService();
    repository.seed(buildSource());

    const copy = await service.duplicate("11111111-1111-4111-8111-111111111111");

    expect(copy.slug).toBe("workshop-page-copy");
  });

  it("advances the copy slug when earlier copies already exist", async () => {
    const { repository, service } = createService();
    repository.seed(buildSource());
    repository.seed(buildSource({ id: "22222222-2222-4222-8222-222222222222", slug: "workshop-page-copy" }));

    const copy = await service.duplicate("11111111-1111-4111-8111-111111111111");

    expect(copy.slug).toBe("workshop-page-copy-2");
  });

  it("rejects an unknown source project with a not-found error", async () => {
    const { service } = createService();

    await expect(service.duplicate("99999999-9999-4999-8999-999999999999")).rejects.toBeInstanceOf(ApiException);
  });
});
