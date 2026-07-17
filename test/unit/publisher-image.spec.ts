import { renderProject } from "../../src/publisher/render-project";
import type { ProjectDocument } from "../../src/publisher/project-document";

describe("renderProject image blocks", () => {
  const base: ProjectDocument = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Gallery",
    slug: "gallery",
    blocks: []
  };

  it("renders an img with escaped src and alt attributes", () => {
    const html = renderProject({
      ...base,
      blocks: [
        { id: "i", type: "image", url: 'https://x.test/a.png?a="1"&b=2', alt: 'Tulips & "sunrise" <dawn>' }
      ]
    });

    expect(html).toContain(
      '<img src="https://x.test/a.png?a=&quot;1&quot;&amp;b=2" alt="Tulips &amp; &quot;sunrise&quot; &lt;dawn&gt;">'
    );
    expect(html).not.toContain("<script");
  });
});
