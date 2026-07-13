import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";

import {
  blocksApiProperty,
  ButtonBlockDto,
  HeadingBlockDto,
  SectionBlockDto,
  TextBlockDto,
  type BlockDto
} from "./block.dto";

@ApiExtraModels(HeadingBlockDto, TextBlockDto, ButtonBlockDto, SectionBlockDto)
export class ProjectResponseDto {
  @ApiProperty({ format: "uuid", example: "123e4567-e89b-42d3-a456-426614174000" })
  id!: string;

  @ApiProperty({ example: "Workshop page" })
  name!: string;

  @ApiProperty({ example: "workshop-page" })
  slug!: string;

  @ApiProperty(blocksApiProperty())
  blocks!: BlockDto[];

  @ApiProperty({ type: String, nullable: true, example: "#1f2933" })
  textColor!: string | null;

  @ApiProperty({ type: String, nullable: true, example: "#176b5b" })
  buttonColor!: string | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true, example: null })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
