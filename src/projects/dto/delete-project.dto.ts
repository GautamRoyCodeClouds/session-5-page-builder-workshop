import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

/**
 * Request body for DELETE /api/projects/:id.
 *
 * The caller MUST set `confirm` to `true`; any other value or an absent body
 * will be rejected with 400 before any data is touched.
 */
export class DeleteProjectDto {
  @ApiProperty({
    description: "Must be `true` to confirm deletion. Any other value is rejected with 400.",
    example: true,
    type: "boolean"
  })
  @IsBoolean()
  confirm!: boolean;
}
