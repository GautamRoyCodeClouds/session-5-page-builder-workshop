import { renderProject } from "../../src/publisher/render-project";
import type { ProjectDocument } from "../../src/publisher/project-document";

describe("renderProject", () => {
  const project: ProjectDocument = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "A <title> & company",
    slug: "sample-page",
    blocks: [
      { id: "h", type: "heading", text: "First <heading>", level: 1 },
      { id: "t", type: "text", text: "Second & body" },
      { id: "b", type: "button", label: "Third \"link\"", url: "https://example.com/?q=\"value\"&x=1" },
      { id: "s", type: "section", title: "Fourth > section" },
      { id: "d", type: "divider" }
    ]
  };

  it("renders a complete script-free document with escaped content", () => {
    const html = renderProject(project, "en-NZ");

    expect(html).toContain("<!doctype html>");
    expect(html).toContain('<html lang="en-NZ">');
    expect(html).toContain("<title>A &lt;title&gt; &amp; company</title>");
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain("<h1>First &lt;heading&gt;</h1>");
    expect(html).toContain("<p>Second &amp; body</p>");
    expect(html).toContain('<a class="button" href="https://example.com/?q=&quot;value&quot;&amp;x=1">Third &quot;link&quot;</a>');
    expect(html).toContain("<section><h2>Fourth &gt; section</h2></section>");
    expect(html).toContain("<hr>");
    expect(html).not.toContain("<script");
  });

  it("preserves the saved block order", () => {
    const html = renderProject(project);

    expect(html.indexOf("First")).toBeLessThan(html.indexOf("Second"));
    expect(html.indexOf("Second")).toBeLessThan(html.indexOf("Third"));
    expect(html.indexOf("Third")).toBeLessThan(html.indexOf("Fourth"));
  });

  it.each([
    "//example.com/path",
    "/relative/path",
    "relative/path",
    "mailto:hello@example.com",
    "tel:+123456789",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "vbscript:msgbox(1)"
  ])("renders an unsafe URL as non-navigable: %s", (url) => {
    const html = renderProject({
      ...project,
      blocks: [{ id: "unsafe", type: "button", label: "Unsafe", url }]
    });

    expect(html).toContain('<span class="button" aria-disabled="true">Unsafe</span>');
    expect(html).not.toContain("href=");
  });

  it.each(["http://example.com", "https://example.com/path"])(
    "renders an absolute web URL as navigable: %s",
    (url) => {
      const html = renderProject({
        ...project,
        blocks: [{ id: "safe", type: "button", label: "Safe", url }]
      });

      expect(html).toContain(`href="${url}"`);
    }
  );
});
