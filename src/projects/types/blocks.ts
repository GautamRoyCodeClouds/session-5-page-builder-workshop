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

export type ButtonBlock = {
  id: string;
  type: "button";
  label: string;
  url: string;
};

export type SectionBlock = {
  id: string;
  type: "section";
  title: string;
};

export type Block = HeadingBlock | TextBlock | ButtonBlock | SectionBlock;
