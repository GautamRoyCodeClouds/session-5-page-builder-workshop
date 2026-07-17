import { HEX_COLOR_PATTERN, isValidHexColor } from "../../src/common/validation/color";

describe("isValidHexColor", () => {
  it.each(["#1f2933", "#176b5b", "#FFFFFF", "#000000", "#AbC123"])(
    "accepts a #rrggbb hex color: %s",
    (value) => {
      expect(isValidHexColor(value)).toBe(true);
    }
  );

  it.each([
    "1f2933",
    "#fff",
    "#12345",
    "#1234567",
    "#12345g",
    "red",
    "",
    "#1f2933 ",
    "rgb(0,0,0)"
  ])("rejects a non-#rrggbb value: %s", (value) => {
    expect(isValidHexColor(value)).toBe(false);
  });

  it("is anchored so it does not match embedded colors", () => {
    expect(HEX_COLOR_PATTERN.test("prefix #1f2933")).toBe(false);
    expect(HEX_COLOR_PATTERN.test("#1f2933; }")).toBe(false);
  });
});
