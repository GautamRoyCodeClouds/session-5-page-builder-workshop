import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";

import { ProjectResponseDto } from "./project-response.dto";

@ApiExtraModels(ProjectResponseDto)
export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] })
  items!: ProjectResponseDto[];

  @ApiProperty({ example: 1, description: "1-based page number" })
  page!: number;

  @ApiProperty({ example: 20, description: "Items per page, capped at 50" })
  pageSize!: number;

  @ApiProperty({ example: 0, description: "Total number of projects" })
  total!: number;
}
