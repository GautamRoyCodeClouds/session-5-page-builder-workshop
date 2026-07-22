import { renderProject } from "../../src/publisher/render-project";
import type { ProjectDocument } from "../../src/publisher/project-document";
import type { SpacerSize } from "../../src/projects/types/blocks";

describe("renderProject spacer blocks", () => {
  const base: ProjectDocument = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Spaced",
    slug: "spaced",
    blocks: []
  };

  it.each<[SpacerSize, string]>([
    ["small", "16px"],
    ["medium", "40px"],
    ["large", "80px"]
  ])("renders a %s spacer at a fixed %s height", (size, px) => {
    const html = renderProject({ ...base, blocks: [{ id: "s", type: "spacer", size }] });
    expect(html).toContain(`<div class="spacer" style="height: ${px}" aria-hidden="true"></div>`);
  });
});
