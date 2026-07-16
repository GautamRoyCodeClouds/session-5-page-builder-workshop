import { ApiExtraModels, ApiProperty, getSchemaPath } from "@nestjs/swagger";

import { ProjectResponseDto } from "./project-response.dto";

@ApiExtraModels(ProjectResponseDto)
export class ProjectListResponseDto {
  @ApiProperty({ type: "array", items: { $ref: getSchemaPath(ProjectResponseDto) } })
  items!: ProjectResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 0 })
  total!: number;
}
