import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import type { EditableProject, ProjectEntity } from "./project.entity";
import { validateBlocks } from "./validation/validate-blocks";

// The Prisma 7 client is generated with `@ts-nocheck`, so its exported model and
// delegate types degrade to `any` under type-checked linting. This repository is
// the single boundary that touches the generated client; it re-establishes strong
// typing by describing the persisted row and delegate surface explicitly and
// casting the untyped client exactly once.
type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  blocks: unknown;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectData = {
  name: string;
  slug: string;
  blocks: unknown;
  publishedAt?: Date | null;
};

type ProjectDelegate = {
  create(args: { data: ProjectData }): Promise<ProjectRow>;
  findUnique(args: { where: { id: string } | { slug: string } }): Promise<ProjectRow | null>;
  update(args: { where: { id: string }; data: Partial<ProjectData> }): Promise<ProjectRow>;
};

function toEntity(row: ProjectRow): ProjectEntity {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    blocks: validateBlocks(row.blocks),
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get projects(): ProjectDelegate {
    return (this.prisma as unknown as { project: ProjectDelegate }).project;
  }

  async create(input: EditableProject): Promise<ProjectEntity> {
    const row = await this.projects.create({
      data: { name: input.name, slug: input.slug, blocks: input.blocks }
    });
    return toEntity(row);
  }

  async findById(id: string): Promise<ProjectEntity | null> {
    const row = await this.projects.findUnique({ where: { id } });
    return row === null ? null : toEntity(row);
  }

  async findBySlug(slug: string): Promise<ProjectEntity | null> {
    const row = await this.projects.findUnique({ where: { slug } });
    return row === null ? null : toEntity(row);
  }

  async update(id: string, input: EditableProject): Promise<ProjectEntity> {
    const row = await this.projects.update({
      where: { id },
      data: { name: input.name, slug: input.slug, blocks: input.blocks, publishedAt: null }
    });
    return toEntity(row);
  }

  async markPublished(id: string, publishedAt: Date): Promise<ProjectEntity> {
    const row = await this.projects.update({
      where: { id },
      data: { publishedAt }
    });
    return toEntity(row);
  }
}
