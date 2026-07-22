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

  @ApiProperty({ enum: ["primary", "secondary"], required: false, default: "primary" })
  style?: "primary" | "secondary";
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

export class QuoteBlockDto {
  @ApiProperty({ example: "quote-1" })
  id!: string;

  @ApiProperty({ enum: ["quote"] })
  type!: "quote";

  @ApiProperty({ example: "Simplicity is the ultimate sophistication." })
  quote!: string;

  @ApiProperty({ example: "Leonardo da Vinci" })
  attribution!: string;
}

export class ImageBlockDto {
  @ApiProperty({ example: "image-1" })
  id!: string;

  @ApiProperty({ enum: ["image"] })
  type!: "image";

  @ApiProperty({ example: "https://example.com/photo.png" })
  url!: string;

  @ApiProperty({ example: "A field of tulips at sunrise" })
  alt!: string;
}

export class SpacerBlockDto {
  @ApiProperty({ example: "spacer-1" })
  id!: string;

  @ApiProperty({ enum: ["spacer"] })
  type!: "spacer";

  @ApiProperty({ enum: ["small", "medium", "large"] })
  size!: "small" | "medium" | "large";
}

export type BlockDto = Block;

export function blocksApiProperty(): ApiPropertyOptions {
  return {
    type: "array",
    description: "Ordered heading, text, button, section, divider, quote, image, and spacer blocks",
    items: {
      discriminator: {
        propertyName: "type",
        mapping: {
          heading: getSchemaPath(HeadingBlockDto),
          text: getSchemaPath(TextBlockDto),
          button: getSchemaPath(ButtonBlockDto),
          section: getSchemaPath(SectionBlockDto),
          divider: getSchemaPath(DividerBlockDto),
          quote: getSchemaPath(QuoteBlockDto),
          image: getSchemaPath(ImageBlockDto),
          spacer: getSchemaPath(SpacerBlockDto)
        }
      },
      oneOf: [
        { $ref: getSchemaPath(HeadingBlockDto) },
        { $ref: getSchemaPath(TextBlockDto) },
        { $ref: getSchemaPath(ButtonBlockDto) },
        { $ref: getSchemaPath(SectionBlockDto) },
        { $ref: getSchemaPath(DividerBlockDto) },
        { $ref: getSchemaPath(QuoteBlockDto) },
        { $ref: getSchemaPath(ImageBlockDto) },
        { $ref: getSchemaPath(SpacerBlockDto) }
      ]
    }
  };
}
