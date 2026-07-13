import { renderProject } from "../../src/publisher/render-project";
import type { ProjectDocument } from "../../src/publisher/project-document";

describe("renderProject quote block", () => {
  const baseProject: ProjectDocument = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Quote project",
    slug: "quote-project",
    blocks: []
  };

  it("renders semantic blockquote and cite markup with escaped text", () => {
    const html = renderProject({
      ...baseProject,
      blocks: [{ id: "q", type: "quote", quote: "Fifth <quote> & words", attribution: "Sixth \"author\"" }]
    });

    expect(html).toContain("<blockquote>");
    expect(html).toContain("<p>Fifth &lt;quote&gt; &amp; words</p>");
    expect(html).toContain("<cite>Sixth &quot;author&quot;</cite>");
    expect(html).not.toContain("<script");
  });

  it("omits the cite element when a quote has no attribution", () => {
    const html = renderProject({
      ...baseProject,
      blocks: [{ id: "q", type: "quote", quote: "No attribution here", attribution: "" }]
    });

    expect(html).toContain("<blockquote>");
    expect(html).toContain("<p>No attribution here</p>");
    expect(html).not.toContain("<cite>");
  });

  it("omits the cite element when attribution is whitespace-only", () => {
    const html = renderProject({
      ...baseProject,
      blocks: [{ id: "q", type: "quote", quote: "No attribution here", attribution: "   " }]
    });

    expect(html).not.toContain("<cite>");
  });
});
