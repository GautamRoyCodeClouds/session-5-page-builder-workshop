import { BlockValidationError, validateBlocks } from "../../src/projects/validation/validate-blocks";

describe("validateBlocks spacer block", () => {
  it.each(["small", "medium", "large"])("accepts a spacer with size %s", (size) => {
    const blocks = validateBlocks([{ id: "s", type: "spacer", size }]);
    expect(blocks[0]).toEqual({ id: "s", type: "spacer", size });
  });

  it.each([
    ["missing size", { id: "s", type: "spacer" }],
    ["invalid size", { id: "s", type: "spacer", size: "huge" }],
    ["non-string size", { id: "s", type: "spacer", size: 3 }],
    ["extra key", { id: "s", type: "spacer", size: "small", height: 10 }]
  ])("rejects a spacer with %s", (_label, block) => {
    expect(() => validateBlocks([block])).toThrow(BlockValidationError);
  });
});
