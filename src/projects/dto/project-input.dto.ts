import { Transform, type TransformFnParams } from "class-transformer";
import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, Length, Matches } from "class-validator";

import { SLUG_PATTERN } from "../../common/validation/slug";
import {
  blocksApiProperty,
  ButtonBlockDto,
  HeadingBlockDto,
  SectionBlockDto,
  TextBlockDto,
  type BlockDto
} from "./block.dto";

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

@ApiExtraModels(HeadingBlockDto, TextBlockDto, ButtonBlockDto, SectionBlockDto)
export class ProjectInputDto {
  @ApiProperty({ example: "Workshop page", minLength: 1, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiProperty({ example: "workshop-page", minLength: 1, maxLength: 80 })
  @Transform(trimString)
  @IsString()
  @Length(1, 80)
  @Matches(SLUG_PATTERN, { message: "slug must be a lowercase ASCII slug" })
  slug!: string;

  @ApiProperty(blocksApiProperty())
  @IsArray()
  blocks!: BlockDto[];
}
