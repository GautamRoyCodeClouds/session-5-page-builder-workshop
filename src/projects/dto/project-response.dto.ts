import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";

import {
  blocksApiProperty,
  ButtonBlockDto,
  DividerBlockDto,
  HeadingBlockDto,
  QuoteBlockDto,
  SectionBlockDto,
  TextBlockDto,
  type BlockDto
} from "./block.dto";

@ApiExtraModels(HeadingBlockDto, TextBlockDto, ButtonBlockDto, SectionBlockDto, DividerBlockDto, QuoteBlockDto)
export class ProjectResponseDto {
  @ApiProperty({ format: "uuid", example: "123e4567-e89b-42d3-a456-426614174000" })
  id!: string;

  @ApiProperty({ example: "Workshop page" })
  name!: string;

  @ApiProperty({ example: "workshop-page" })
  slug!: string;

  @ApiProperty(blocksApiProperty())
  blocks!: BlockDto[];

  @ApiProperty({ type: String, format: "date-time", nullable: true, example: null })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
