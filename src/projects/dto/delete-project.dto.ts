import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class DeleteProjectDto {
  @ApiProperty({
    enum: [true],
    description: "Must be exactly true to confirm permanent deletion of the project."
  })
  @IsBoolean()
  confirm!: boolean;
}
