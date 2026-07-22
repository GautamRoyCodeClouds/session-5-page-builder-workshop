import { renderProject } from "../../src/publisher/render-project";
import type { ProjectDocument } from "../../src/publisher/project-document";

describe("renderProject button styles", () => {
  const base: ProjectDocument = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Buttons",
    slug: "buttons",
    blocks: []
  };

  it("defaults a button with no style to the primary class", () => {
    const html = renderProject({
      ...base,
      blocks: [{ id: "b", type: "button", label: "Go", url: "https://example.com" }]
    });
    expect(html).toContain('class="button button-primary"');
    expect(html).not.toContain('class="button button-secondary"');
  });

  it("applies the secondary class when selected", () => {
    const html = renderProject({
      ...base,
      blocks: [{ id: "b", type: "button", label: "Go", url: "https://example.com", style: "secondary" }]
    });
    expect(html).toContain('class="button button-secondary"');
  });
});
