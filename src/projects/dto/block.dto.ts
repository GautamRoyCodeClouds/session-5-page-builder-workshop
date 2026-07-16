import { ApiProperty, getSchemaPath, type ApiPropertyOptions } from "@nestjs/swagger";

import type { Block } from "../types/blocks";

export class HeadingBlockDto {
  @ApiProperty({ example: "heading-1" })
  id!: string;

  @ApiProperty({ enum: ["heading"] })
  type!: "heading";

  @ApiProperty({ example: "Welcome" })
  text!: string;

  @ApiProperty({ enum: [1, 2, 3] })
  level!: 1 | 2 | 3;
}

export class TextBlockDto {
  @ApiProperty({ example: "text-1" })
  id!: string;

  @ApiProperty({ enum: ["text"] })
  type!: "text";

  @ApiProperty({ example: "Page copy" })
  text!: string;
}

export class ButtonBlockDto {
  @ApiProperty({ example: "button-1" })
  id!: string;

  @ApiProperty({ enum: ["button"] })
  type!: "button";

  @ApiProperty({ example: "Learn more" })
  label!: string;

  @ApiProperty({ example: "https://example.com" })
  url!: string;
}

export class SectionBlockDto {
  @ApiProperty({ example: "section-1" })
  id!: string;

  @ApiProperty({ enum: ["section"] })
  type!: "section";

  @ApiProperty({ example: "Details" })
  title!: string;
}

export class DividerBlockDto {
  @ApiProperty({ example: "divider-1" })
  id!: string;

  @ApiProperty({ enum: ["divider"] })
  type!: "divider";
}

export type BlockDto = Block;

export function blocksApiProperty(): ApiPropertyOptions {
  return {
    type: "array",
    description: "Ordered heading, text, button, section, and divider blocks",
    items: {
      discriminator: {
        propertyName: "type",
        mapping: {
          heading: getSchemaPath(HeadingBlockDto),
          text: getSchemaPath(TextBlockDto),
          button: getSchemaPath(ButtonBlockDto),
          section: getSchemaPath(SectionBlockDto),
          divider: getSchemaPath(DividerBlockDto)
        }
      },
      oneOf: [
        { $ref: getSchemaPath(HeadingBlockDto) },
        { $ref: getSchemaPath(TextBlockDto) },
        { $ref: getSchemaPath(ButtonBlockDto) },
        { $ref: getSchemaPath(SectionBlockDto) },
        { $ref: getSchemaPath(DividerBlockDto) }
      ]
    }
  };
}
