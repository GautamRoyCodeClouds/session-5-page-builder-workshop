import type { Block } from "./types/blocks";

export type ProjectEntity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  blocks: Block[];
  textColor: string | null;
  buttonColor: string | null;
  version: number;
  publishedAt: Date | null;
  lastSuccessfulPublishAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EditableProject = Pick<ProjectEntity, "name" | "slug" | "description" | "blocks" | "textColor" | "buttonColor">;
