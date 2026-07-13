import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { RenameProjectDto } from "../../src/projects/dto/rename-project.dto";

describe("RenameProjectDto", () => {
  it("trims a project name before validation", async () => {
    const input = plainToInstance(RenameProjectDto, { name: "  Renamed page  " });

    await expect(validate(input)).resolves.toHaveLength(0);
    expect(input.name).toBe("Renamed page");
  });

  it("rejects a blank name", async () => {
    const input = plainToInstance(RenameProjectDto, { name: "" });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });

  it("rejects a whitespace-only name", async () => {
    const input = plainToInstance(RenameProjectDto, { name: "   " });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });
});
