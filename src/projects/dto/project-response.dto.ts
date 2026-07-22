import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";

import {
  blocksApiProperty,
  ButtonBlockDto,
  DividerBlockDto,
  HeadingBlockDto,
  ImageBlockDto,
  QuoteBlockDto,
  SectionBlockDto,
  SpacerBlockDto,
  TextBlockDto,
  type BlockDto
} from "./block.dto";

@ApiExtraModels(HeadingBlockDto, TextBlockDto, ButtonBlockDto, SectionBlockDto, DividerBlockDto, QuoteBlockDto, ImageBlockDto, SpacerBlockDto)
export class ProjectResponseDto {
  @ApiProperty({ format: "uuid", example: "123e4567-e89b-42d3-a456-426614174000" })
  id!: string;

  @ApiProperty({ example: "Workshop page" })
  name!: string;

  @ApiProperty({ example: "workshop-page" })
  slug!: string;

  @ApiProperty({ type: String, nullable: true, maxLength: 300, example: null })
  description!: string | null;

  @ApiProperty(blocksApiProperty())
  blocks!: BlockDto[];

  @ApiProperty({ type: String, nullable: true, example: "#1f2933" })
  textColor!: string | null;

  @ApiProperty({ type: String, nullable: true, example: "#176b5b" })
  buttonColor!: string | null;

  @ApiProperty({ example: 1, minimum: 1 })
  version!: number;

  @ApiProperty({ type: String, format: "date-time", nullable: true, example: null })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true, example: null })
  lastSuccessfulPublishAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
