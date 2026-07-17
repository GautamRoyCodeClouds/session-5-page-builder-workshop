import { BlockValidationError, validateBlocks } from "../../src/projects/validation/validate-blocks";

describe("validateBlocks image block", () => {
  it("accepts an image block with a url and non-empty alt", () => {
    const blocks = validateBlocks([
      { id: "i", type: "image", url: "https://example.com/a.png", alt: "A photo" }
    ]);

    expect(blocks[0]).toEqual({ id: "i", type: "image", url: "https://example.com/a.png", alt: "A photo" });
  });

  it.each([
    ["empty alt", { id: "i", type: "image", url: "https://example.com/a.png", alt: "" }],
    ["whitespace-only alt", { id: "i", type: "image", url: "https://example.com/a.png", alt: "   " }],
    ["missing alt", { id: "i", type: "image", url: "https://example.com/a.png" }],
    ["missing url", { id: "i", type: "image", alt: "A photo" }],
    ["extra key", { id: "i", type: "image", url: "https://example.com/a.png", alt: "A photo", caption: "x" }]
  ])("rejects an image block with %s", (_label, block) => {
    expect(() => validateBlocks([block])).toThrow(BlockValidationError);
  });
});
