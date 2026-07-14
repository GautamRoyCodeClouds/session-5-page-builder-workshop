import { Transform, type TransformFnParams } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

export class ProjectNameDto {
  @ApiProperty({ example: "Workshop page", minLength: 1, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @Length(1, 120)
  name!: string;
}
