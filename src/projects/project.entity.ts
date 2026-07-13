import type { Block } from "./types/blocks";

export type ProjectEntity = {
  id: string;
  name: string;
  slug: string;
  blocks: Block[];
  textColor: string | null;
  buttonColor: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EditableProject = Pick<ProjectEntity, "name" | "slug" | "blocks" | "textColor" | "buttonColor">;

export type ProjectSummaryEntity = Pick<ProjectEntity, "id" | "name" | "slug" | "publishedAt" | "updatedAt">;
