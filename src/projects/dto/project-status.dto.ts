import { ApiProperty } from "@nestjs/swagger";

export class ProjectStatusDto {
  @ApiProperty({ format: "uuid", example: "123e4567-e89b-42d3-a456-426614174000" })
  id!: string;

  @ApiProperty({ enum: ["draft", "published"], example: "draft" })
  status!: "draft" | "published";

  @ApiProperty({ type: String, format: "date-time", nullable: true, example: null })
  publishedAt!: Date | null;
}
