import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";

import { SLUG_PATTERN } from "../../common/validation/slug";

export class SlugAvailabilityQueryDto {
  @ApiProperty({ example: "workshop-page", minLength: 1, maxLength: 80 })
  @IsString()
  @Length(1, 80)
  @Matches(SLUG_PATTERN, { message: "slug must be a lowercase ASCII slug" })
  slug!: string;
}

export class SlugAvailabilityResponseDto {
  @ApiProperty({ example: "workshop-page" })
  slug!: string;

  @ApiProperty({ example: true })
  available!: boolean;
}
