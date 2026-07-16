import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { ListProjectsQueryDto } from "../../src/projects/dto/list-projects-query.dto";

describe("ListProjectsQueryDto", () => {
  it("defaults to page 1 and pageSize 20 when omitted", async () => {
    const input = plainToInstance(ListProjectsQueryDto, {});

    await expect(validate(input)).resolves.toHaveLength(0);
    expect(input.page).toBe(1);
    expect(input.pageSize).toBe(20);
  });

  it.each([
    ["zero", "0"],
    ["negative", "-1"],
    ["non-integer", "1.5"],
    ["non-numeric", "abc"]
  ])("rejects a %s page value", async (_description, value) => {
    const input = plainToInstance(ListProjectsQueryDto, { page: value });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });

  it.each([
    ["zero", "0"],
    ["negative", "-1"],
    ["non-integer", "1.5"],
    ["non-numeric", "abc"],
    ["above the maximum", "51"]
  ])("rejects a %s pageSize value", async (_description, value) => {
    const input = plainToInstance(ListProjectsQueryDto, { pageSize: value });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });

  it("accepts pageSize at the maximum boundary", async () => {
    const input = plainToInstance(ListProjectsQueryDto, { pageSize: "50" });

    await expect(validate(input)).resolves.toHaveLength(0);
    expect(input.pageSize).toBe(50);
  });
});
