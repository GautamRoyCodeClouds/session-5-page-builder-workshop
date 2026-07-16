import { ApiProperty } from "@nestjs/swagger";
import { Equals, IsBoolean, IsDefined } from "class-validator";

export class DeleteProjectDto {
  @ApiProperty({ example: true, description: "Must be true to confirm project deletion" })
  @IsDefined()
  @IsBoolean()
  @Equals(true, { message: "confirm must be true" })
  confirm!: boolean;
}
