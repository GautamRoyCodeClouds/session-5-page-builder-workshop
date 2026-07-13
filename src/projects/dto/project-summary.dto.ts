import { ApiProperty } from "@nestjs/swagger";

export class ProjectSummaryDto {
  @ApiProperty({ format: "uuid", example: "123e4567-e89b-42d3-a456-426614174000" })
  id!: string;

  @ApiProperty({ example: "Workshop page" })
  name!: string;

  @ApiProperty({ example: "workshop-page" })
  slug!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true, example: null })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
