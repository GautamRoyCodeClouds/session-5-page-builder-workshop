import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";

import { ProjectResponseDto } from "./project-response.dto";

@ApiExtraModels(ProjectResponseDto)
export class ProjectListResponseDto {
  @ApiProperty({ type: () => [ProjectResponseDto] })
  items!: ProjectResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 0 })
  total!: number;
}
