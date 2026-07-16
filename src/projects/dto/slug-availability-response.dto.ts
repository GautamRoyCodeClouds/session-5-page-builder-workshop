import { ApiProperty } from "@nestjs/swagger";

export class SlugAvailabilityResponseDto {
  @ApiProperty({ description: "True if the slug is not taken by any existing project" })
  available!: boolean;
}
