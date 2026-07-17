import { renderProject } from "../../src/publisher/render-project";
import type { ProjectDocument } from "../../src/publisher/project-document";

describe("renderProject page description metadata", () => {
  const base: ProjectDocument = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Sample page",
    slug: "sample-page",
    blocks: [{ id: "t", type: "text", text: "Body" }]
  };

  it("renders one escaped meta description when a description is present", () => {
    const html = renderProject({ ...base, description: 'Tours & "deals" <today>' });

    const matches = html.match(/<meta name="description"/g) ?? [];
    expect(matches).toHaveLength(1);
    expect(html).toContain(
      '<meta name="description" content="Tours &amp; &quot;deals&quot; &lt;today&gt;">'
    );
  });

  it.each([
    ["absent", undefined],
    ["null", null],
    ["empty", ""],
    ["whitespace-only", "   "]
  ])("omits the meta description tag when the description is %s", (_label, description) => {
    const html = renderProject({ ...base, description });

    expect(html).not.toContain('name="description"');
  });
});
