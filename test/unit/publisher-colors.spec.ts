import { renderProject } from "../../src/publisher/render-project";
import type { ProjectDocument } from "../../src/publisher/project-document";

describe("renderProject color palette", () => {
  const base: ProjectDocument = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Sample page",
    slug: "sample-page",
    blocks: [{ id: "t", type: "text", text: "Body" }]
  };

  it("applies custom text and button colors when provided", () => {
    const html = renderProject({ ...base, textColor: "#123456", buttonColor: "#abcdef" });

    expect(html).toContain("color: #123456;");
    expect(html).toContain("background: #abcdef;");
  });

  it.each([
    ["absent", {}],
    ["null", { textColor: null, buttonColor: null }]
  ])("falls back to the default palette when colors are %s", (_label, overrides) => {
    const html = renderProject({ ...base, ...overrides });

    expect(html).toContain("color: #1f2933;");
    expect(html).toContain("background: #176b5b;");
  });
});
