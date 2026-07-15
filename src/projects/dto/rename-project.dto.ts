import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class RenameProjectDto {
  @ApiProperty({ example: "My Project", description: "The new name of the project" })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
