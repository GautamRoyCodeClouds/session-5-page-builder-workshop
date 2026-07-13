import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { ProjectInputDto } from "../../src/projects/dto/project-input.dto";

describe("ProjectInputDto", () => {
  const validInput = {
    name: "Workshop page",
    slug: "workshop-page",
    blocks: []
  };

  it("trims a project name before validation and persistence", async () => {
    const input = plainToInstance(ProjectInputDto, { ...validInput, name: "  Workshop page  " });

    await expect(validate(input)).resolves.toHaveLength(0);
    expect(input.name).toBe("Workshop page");
  });

  it("rejects a whitespace-only project name", async () => {
    const input = plainToInstance(ProjectInputDto, { ...validInput, name: "   " });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });

  it("allows textColor and buttonColor to be omitted", async () => {
    const input = plainToInstance(ProjectInputDto, validInput);

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it("accepts valid hex textColor and buttonColor", async () => {
    const input = plainToInstance(ProjectInputDto, {
      ...validInput,
      textColor: "#1f2933",
      buttonColor: "#176B5B"
    });

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it.each(["textColor", "buttonColor"])("rejects an invalid %s", async (field) => {
    const input = plainToInstance(ProjectInputDto, { ...validInput, [field]: "not-a-color" });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });
});
