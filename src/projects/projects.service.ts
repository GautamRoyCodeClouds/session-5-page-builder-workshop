import { HttpStatus, Injectable } from "@nestjs/common";

import { ApiException } from "../common/errors/api-exception";
import { PublisherService } from "../publisher/publisher.service";
import type { ListProjectsQueryDto } from "./dto/list-projects-query.dto";
import type { DeleteProjectDto } from "./dto/delete-project.dto";
import type { ProjectInputDto } from "./dto/project-input.dto";
import type { EditableProject, ProjectEntity } from "./project.entity";
import { ProjectsRepository } from "./projects.repository";
import { BlockValidationError, validateBlocks } from "./validation/validate-blocks";

export type PublishResult = {
  project: ProjectEntity;
  url: string;
};

export type SlugAvailability = {
  slug: string;
  available: boolean;
};

export type ProjectListResult = {
  items: ProjectEntity[];
  page: number;
  pageSize: number;
  total: number;
};

const MAX_OFFSET = 10_000;


function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "P2002";
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly repository: ProjectsRepository,
    private readonly publisher: PublisherService
  ) {}

  async create(input: ProjectInputDto): Promise<ProjectEntity> {
    const project = this.toEditableProject(input);
    if (await this.repository.findBySlug(project.slug) !== null) {
      this.throwSlugConflict(project.slug);
    }

    try {
      return await this.repository.create(project);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        this.throwSlugConflict(project.slug);
      }
      throw error;
    }
  }

  async get(id: string): Promise<ProjectEntity> {
    const project = await this.repository.findById(id);
    if (project === null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND", "Project not found");
    }
    return project;
  }

  async update(id: string, input: ProjectInputDto): Promise<ProjectEntity> {
    await this.get(id);
    const project = this.toEditableProject(input);
    const slugOwner = await this.repository.findBySlug(project.slug);
    if (slugOwner !== null && slugOwner.id !== id) {
      this.throwSlugConflict(project.slug);
    }

    try {
      return await this.repository.update(id, project);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        this.throwSlugConflict(project.slug);
      }
      throw error;
    }
  }

  async rename(id: string, name: string): Promise<ProjectEntity> {
    await this.get(id);
    return this.repository.updateName(id, name);
  }

  async slugAvailability(slug: string): Promise<SlugAvailability> {
    return { slug, available: await this.repository.findBySlug(slug) === null };
  }

  async list(query: ListProjectsQueryDto): Promise<ProjectListResult> {
    const { page, pageSize } = query;
    const offset = (page - 1) * pageSize;
    if (offset > MAX_OFFSET) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        "BAD_REQUEST",
        "page exceeds the maximum supported offset",
        { maxOffset: MAX_OFFSET }
      );
    }

    const { rows, total } = await this.repository.list(offset, pageSize);
    return { items: rows, page, pageSize, total };
  }

  async publish(id: string): Promise<PublishResult> {
    const project = await this.get(id);
    await this.publisher.publish(project);
    const published = await this.repository.markPublished(id, new Date());
    return { project: published, url: `/sites/${published.slug}` };
  }

  async delete(id: string, input: DeleteProjectDto): Promise<void> {
    if (input.confirm !== true) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Invalid delete confirmation");
    }

    await this.get(id);
    await this.repository.delete(id);
  }

  private toEditableProject(input: ProjectInputDto): EditableProject {
    try {
      return {
        name: input.name,
        slug: input.slug,
        blocks: validateBlocks(input.blocks)
      };
    } catch (error) {
      if (error instanceof BlockValidationError) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "BAD_REQUEST",
          "Invalid blocks",
          [error.message]
        );
      }
      throw error;
    }
  }

  private throwSlugConflict(slug: string): never {
    throw new ApiException(
      HttpStatus.CONFLICT,
      "SLUG_CONFLICT",
      "That slug is already in use",
      { slug }
    );
  }
}
