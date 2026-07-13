import { isValidHexColor } from "../../src/common/validation/color";

describe("isValidHexColor", () => {
  it.each(["#1f2933", "#176B5B", "#FFFFFF", "#000000"])("accepts %s", (value) => {
    expect(isValidHexColor(value)).toBe(true);
  });

  it.each([
    ["missing the leading #", "1f2933"],
    ["too short", "#1f293"],
    ["too long", "#1f29333"],
    ["non-hex characters", "#gggggg"],
    ["a named color", "tomato"],
    ["an empty string", ""]
  ])("rejects %s", (_description, value) => {
    expect(isValidHexColor(value)).toBe(false);
  });
});
