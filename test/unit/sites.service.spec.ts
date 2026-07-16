import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

jest.mock("../../src/projects/projects.repository", () => ({
  ProjectsRepository: class ProjectsRepository {}
}));

import type { AppConfigService } from "../../src/common/config/app-config.service";
import type { ProjectEntity } from "../../src/projects/project.entity";
import type { ProjectsRepository } from "../../src/projects/projects.repository";
import { PublisherService } from "../../src/publisher/publisher.service";
import { SitesService } from "../../src/sites/sites.service";

describe("SitesService", () => {
  const projectId = "123e4567-e89b-42d3-a456-426614174000";
  let publishDir: string;
  let project: ProjectEntity;
  let publisher: PublisherService;
  let sites: SitesService;

  beforeEach(async () => {
    publishDir = await mkdtemp(join(tmpdir(), "session5-sites-"));
    const config = { publishDir, siteLanguage: "en" } as AppConfigService;
    project = {
      id: projectId,
      name: "Published page",
      slug: "old-slug",
      blocks: [{ id: "body", type: "text", text: "Published body" }],
      publishedAt: new Date(),
      lastSuccessfulPublishAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const repository = {
      findBySlug: (slug: string): Promise<ProjectEntity | null> =>
        Promise.resolve(project.slug === slug ? project : null)
    } as ProjectsRepository;
    publisher = new PublisherService(config);
    sites = new SitesService(config, repository);
  });

  afterEach(async () => {
    await rm(publishDir, { recursive: true, force: true });
  });

  it("serves only the current slug of a currently published project", async () => {
    await publisher.publish(project);
    await expect(sites.read("old-slug")).resolves.toContain("Published body");

    project = { ...project, slug: "new-slug", publishedAt: null };
    await expect(sites.read("old-slug")).rejects.toThrow("Published site not found");
    await expect(sites.read("new-slug")).rejects.toThrow("Published site not found");

    await publisher.publish(project);
    project = { ...project, publishedAt: new Date() };
    await expect(sites.read("new-slug")).resolves.toContain("Published body");
    await expect(sites.read("old-slug")).rejects.toThrow("Published site not found");
  });
});
