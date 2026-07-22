export type HeadingBlock = {
  id: string;
  type: "heading";
  text: string;
  level: 1 | 2 | 3;
};

export type TextBlock = {
  id: string;
  type: "text";
  text: string;
};

export type ButtonStyle = "primary" | "secondary";

export type ButtonBlock = {
  id: string;
  type: "button";
  label: string;
  url: string;
  style?: ButtonStyle;
};

export type SectionBlock = {
  id: string;
  type: "section";
  title: string;
};

export type DividerBlock = {
  id: string;
  type: "divider";
};

export type QuoteBlock = {
  id: string;
  type: "quote";
  quote: string;
  attribution: string;
};

export type ImageBlock = {
  id: string;
  type: "image";
  url: string;
  alt: string;
};

export type SpacerSize = "small" | "medium" | "large";

export type SpacerBlock = {
  id: string;
  type: "spacer";
  size: SpacerSize;
};

export type Block =
  | HeadingBlock
  | TextBlock
  | ButtonBlock
  | SectionBlock
  | DividerBlock
  | QuoteBlock
  | ImageBlock
  | SpacerBlock;
