import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { RenameProjectDto } from "../../src/projects/dto/rename-project.dto";

describe("RenameProjectDto", () => {
  it("should be valid with a nonblank string", async () => {
    const dto = plainToInstance(RenameProjectDto, { name: "New Name" });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should be invalid with a blank string", async () => {
    const dto = plainToInstance(RenameProjectDto, { name: "  " });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should be invalid with no name", async () => {
    const dto = plainToInstance(RenameProjectDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
