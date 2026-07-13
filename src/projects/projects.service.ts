import { HttpStatus, Injectable } from "@nestjs/common";

import { ApiException } from "../common/errors/api-exception";
import { PublisherService } from "../publisher/publisher.service";
import type { ProjectInputDto } from "./dto/project-input.dto";
import type { EditableProject, ProjectEntity } from "./project.entity";
import { ProjectsRepository } from "./projects.repository";
import { BlockValidationError, validateBlocks } from "./validation/validate-blocks";

export type PublishResult = {
  project: ProjectEntity;
  url: string;
};

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

  async delete(id: string, confirm: boolean): Promise<void> {
    if (confirm !== true) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        "BAD_REQUEST",
        "Deletion requires explicit confirmation: set confirm to true"
      );
    }
    await this.get(id);
    await this.repository.delete(id);
  }

  async publish(id: string): Promise<PublishResult> {
    const project = await this.get(id);
    await this.publisher.publish(project);
    const published = await this.repository.markPublished(id, new Date());
    return { project: published, url: `/sites/${published.slug}` };
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
