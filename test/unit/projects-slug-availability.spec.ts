import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import type { ProjectEntity } from "../../src/projects/project.entity";
import type { ProjectsRepository } from "../../src/projects/projects.repository";
import type { PublisherService } from "../../src/publisher/publisher.service";
import { SlugAvailabilityQueryDto } from "../../src/projects/dto/slug-availability.dto";
import { ProjectsService } from "../../src/projects/projects.service";

describe("SlugAvailabilityQueryDto", () => {
  it("accepts a valid lowercase slug", async () => {
    const query = plainToInstance(SlugAvailabilityQueryDto, { slug: "workshop-page" });

    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it.each([
    ["missing slug", {}],
    ["empty slug", { slug: "" }],
    ["uppercase slug", { slug: "Not-Lowercase" }],
    ["slug with spaces", { slug: "two words" }],
    ["slug with leading hyphen", { slug: "-leading" }],
    ["slug longer than 80 characters", { slug: "a".repeat(81) }]
  ])("rejects a %s", async (_description, input) => {
    const query = plainToInstance(SlugAvailabilityQueryDto, input);

    await expect(validate(query)).resolves.not.toHaveLength(0);
  });
});

describe("ProjectsService.slugAvailability", () => {
  const owner: ProjectEntity = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Workshop page",
    slug: "workshop-page",
    description: null,
    textColor: null,
    buttonColor: null,
    version: 1,
    blocks: [],
    publishedAt: null,
    lastSuccessfulPublishAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  function createService(): { service: ProjectsService; findBySlug: jest.Mock; writes: jest.Mock } {
    const findBySlug = jest.fn((slug: string) =>
      Promise.resolve(owner.slug === slug ? owner : null)
    );
    const writes = jest.fn(() => {
      throw new Error("slug availability must not write project records");
    });
    const repository = {
      findBySlug,
      create: writes,
      update: writes,
      markPublished: writes
    } as unknown as ProjectsRepository;
    const publisher = {
      publish: writes
    } as unknown as PublisherService;
    return { service: new ProjectsService(repository, publisher), findBySlug, writes };
  }

  it("reports an unclaimed slug as available", async () => {
    const { service } = createService();

    await expect(service.slugAvailability("fresh-slug")).resolves.toEqual({
      slug: "fresh-slug",
      available: true
    });
  });

  it("reports a slug owned by an existing project as unavailable", async () => {
    const { service } = createService();

    await expect(service.slugAvailability("workshop-page")).resolves.toEqual({
      slug: "workshop-page",
      available: false
    });
  });

  it("only reads and never creates or updates project records", async () => {
    const { service, findBySlug, writes } = createService();

    await service.slugAvailability("fresh-slug");
    await service.slugAvailability("workshop-page");

    expect(findBySlug).toHaveBeenCalledTimes(2);
    expect(writes).not.toHaveBeenCalled();
  });
});
