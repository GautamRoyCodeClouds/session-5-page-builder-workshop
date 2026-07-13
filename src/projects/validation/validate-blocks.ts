import type { Block } from "../types/blocks";

type JsonObject = Record<string, unknown>;

const allowedKeys: Record<Block["type"], readonly string[]> = {
  heading: ["id", "type", "text", "level"],
  text: ["id", "type", "text"],
  button: ["id", "type", "label", "url"],
  section: ["id", "type", "title"],
  divider: ["id", "type"]
};

export class BlockValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockValidationError";
  }
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: JsonObject, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

function hasValidId(value: JsonObject): boolean {
  return typeof value.id === "string" && value.id.trim().length > 0;
}

function validateBlock(value: unknown, index: number): Block {
  if (!isObject(value) || typeof value.type !== "string" || !hasValidId(value)) {
    throw new BlockValidationError(`blocks[${index}] is not a valid block`);
  }

  switch (value.type) {
    case "heading":
      if (
        !hasExactKeys(value, allowedKeys.heading)
        || typeof value.text !== "string"
        || (value.level !== 1 && value.level !== 2 && value.level !== 3)
      ) {
        throw new BlockValidationError(`blocks[${index}] is not a valid heading block`);
      }
      return value as HeadingBlockShape;
    case "text":
      if (!hasExactKeys(value, allowedKeys.text) || typeof value.text !== "string") {
        throw new BlockValidationError(`blocks[${index}] is not a valid text block`);
      }
      return value as TextBlockShape;
    case "button":
      if (
        !hasExactKeys(value, allowedKeys.button)
        || typeof value.label !== "string"
        || typeof value.url !== "string"
      ) {
        throw new BlockValidationError(`blocks[${index}] is not a valid button block`);
      }
      return value as ButtonBlockShape;
    case "section":
      if (!hasExactKeys(value, allowedKeys.section) || typeof value.title !== "string") {
        throw new BlockValidationError(`blocks[${index}] is not a valid section block`);
      }
      return value as SectionBlockShape;
    case "divider":
      if (!hasExactKeys(value, allowedKeys.divider)) {
        throw new BlockValidationError(`blocks[${index}] is not a valid divider block`);
      }
      return value as DividerBlockShape;
    default:
      throw new BlockValidationError(`blocks[${index}] has an unknown block type`);
  }
}

type HeadingBlockShape = Extract<Block, { type: "heading" }>;
type TextBlockShape = Extract<Block, { type: "text" }>;
type ButtonBlockShape = Extract<Block, { type: "button" }>;
type SectionBlockShape = Extract<Block, { type: "section" }>;
type DividerBlockShape = Extract<Block, { type: "divider" }>;

export function validateBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) {
    throw new BlockValidationError("blocks must be an array");
  }

  const blocks = value.map((block, index) => validateBlock(block, index));
  const identifiers = new Set<string>();

  for (const block of blocks) {
    if (identifiers.has(block.id)) {
      throw new BlockValidationError("Block IDs must be unique");
    }
    identifiers.add(block.id);
  }

  return blocks;
}
