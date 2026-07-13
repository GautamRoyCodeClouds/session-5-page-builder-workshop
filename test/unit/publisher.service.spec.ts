import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { AppConfigService } from "../../src/common/config/app-config.service";
import { PublisherService } from "../../src/publisher/publisher.service";

describe("PublisherService", () => {
  const projectId = "123e4567-e89b-42d3-a456-426614174000";
  let publishDir: string;
  let service: PublisherService;

  beforeEach(async () => {
    publishDir = await mkdtemp(join(tmpdir(), "session5-publisher-"));
    service = new PublisherService({ publishDir, siteLanguage: "en" } as AppConfigService);
  });

  afterEach(async () => {
    await rm(publishDir, { recursive: true, force: true });
  });

  it("publishes a project to its stable project ID", async () => {
    const path = await service.publish({
      id: projectId,
      name: "Published page",
      slug: "published-page",
      blocks: [{ id: "text-1", type: "text", text: "First version" }],
      textColor: null,
      buttonColor: null
    });

    expect(path).toBe(join(publishDir, `${projectId}.html`));
    await expect(readFile(path, "utf8")).resolves.toContain("First version");
    await expect(readdir(publishDir)).resolves.toEqual([`${projectId}.html`]);
  });

  it("atomically replaces a prior version without leaving temporary files", async () => {
    const base = {
      id: projectId,
      name: "Published page",
      slug: "published-page",
      textColor: null,
      buttonColor: null
    };
    await service.publish({
      ...base,
      blocks: [{ id: "text-1", type: "text", text: "First version" }]
    });
    const path = await service.publish({
      ...base,
      blocks: [{ id: "text-1", type: "text", text: "Second version" }]
    });

    const html = await readFile(path, "utf8");
    expect(html).toContain("Second version");
    expect(html).not.toContain("First version");
    await expect(readdir(publishDir)).resolves.toEqual([`${projectId}.html`]);
  });

  it("rejects a project ID that could escape the publish directory", async () => {
    await expect(service.publish({
      id: "../unsafe",
      name: "Unsafe",
      slug: "safe-slug",
      blocks: [],
      textColor: null,
      buttonColor: null
    })).rejects.toThrow("Invalid project ID");
  });
});
