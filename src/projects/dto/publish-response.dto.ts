import { ApiProperty } from "@nestjs/swagger";

import { ProjectResponseDto } from "./project-response.dto";

export class PublishResponseDto {
  @ApiProperty({ type: ProjectResponseDto })
  project!: ProjectResponseDto;

  @ApiProperty({ example: "/sites/workshop-page" })
  url!: string;
}
