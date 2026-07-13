import type { Block } from "../projects/types/blocks";

export type ProjectDocument = {
  id: string;
  name: string;
  slug: string;
  blocks: Block[];
  textColor: string | null;
  buttonColor: string | null;
};
