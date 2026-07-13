import { Transform, type TransformFnParams } from "class-transformer";
import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, Length, Matches } from "class-validator";

import { HEX_COLOR_PATTERN } from "../../common/validation/color";
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
  @IsString()
  @Length(1, 80)
  @Matches(SLUG_PATTERN, { message: "slug must be a lowercase ASCII slug" })
  slug!: string;

  @ApiProperty(blocksApiProperty())
  @IsArray()
  blocks!: BlockDto[];

  @ApiProperty({ example: "#1f2933", required: false, nullable: true })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, { message: "textColor must be a #rrggbb hex color" })
  textColor?: string;

  @ApiProperty({ example: "#176b5b", required: false, nullable: true })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, { message: "buttonColor must be a #rrggbb hex color" })
  buttonColor?: string;
}
