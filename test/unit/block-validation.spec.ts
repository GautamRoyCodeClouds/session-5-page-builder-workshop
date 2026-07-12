import { BlockValidationError, validateBlocks } from "../../src/projects/validation/validate-blocks";

describe("validateBlocks", () => {
  it("accepts every baseline block type in saved order", () => {
    const value = [
      { id: "heading-1", type: "heading", text: "Welcome", level: 1 },
      { id: "text-1", type: "text", text: "Body copy" },
      { id: "button-1", type: "button", label: "Visit", url: "https://example.com" },
      { id: "section-1", type: "section", title: "Details" }
    ];

    expect(validateBlocks(value)).toEqual(value);
  });

  it.each([
    ["a non-array value", { id: "text-1", type: "text", text: "Body" }],
    ["an unknown block type", [{ id: "x", type: "divider" }]],
    ["a missing field", [{ id: "x", type: "button", label: "Missing URL" }]],
    ["an unexpected field", [{ id: "x", type: "text", text: "Body", html: "<b>Body</b>" }]],
    ["an invalid heading level", [{ id: "x", type: "heading", text: "Title", level: 4 }]],
    ["an empty block ID", [{ id: "", type: "text", text: "Body" }]]
  ])("rejects %s", (_description, value) => {
    expect(() => validateBlocks(value)).toThrow(BlockValidationError);
  });

  it("rejects duplicate block IDs", () => {
    expect(() => validateBlocks([
      { id: "same", type: "text", text: "First" },
      { id: "same", type: "section", title: "Second" }
    ])).toThrow("Block IDs must be unique");
  });

  it("does not enforce the builder-only 20 block limit", () => {
    const blocks = Array.from({ length: 21 }, (_, index) => ({
      id: `text-${index}`,
      type: "text",
      text: `Block ${index}`
    }));

    expect(validateBlocks(blocks)).toHaveLength(21);
  });
});
