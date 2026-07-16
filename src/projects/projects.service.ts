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

const SLUG_MAX_LENGTH = 80;

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "P2002";
}

function withCopySuffix(baseSlug: string, suffix: string): string {
  const available = SLUG_MAX_LENGTH - suffix.length;
  const trimmed = baseSlug.slice(0, available).replace(/-+$/u, "");
  const base = trimmed.length > 0 ? trimmed : "project";
  return `${base}${suffix}`;
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

  async isSlugAvailable(slug: string): Promise<boolean> {
    return await this.repository.findBySlug(slug) === null;
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

  async delete(id: string, confirmed: boolean): Promise<void> {
    if (confirmed !== true) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        "BAD_REQUEST",
        "Deletion must be confirmed with confirm: true"
      );
    }
    await this.get(id);
    await this.repository.delete(id);
  }

  async duplicate(id: string): Promise<ProjectEntity> {
    const source = await this.get(id);
    const slug = await this.nextAvailableCopySlug(source.slug);
    return this.create({
      name: source.name,
      slug,
      description: source.description ?? undefined,
      blocks: source.blocks
    });
  }

  async publish(id: string): Promise<PublishResult> {
    const project = await this.get(id);
    await this.publisher.publish(project);
    const published = await this.repository.markPublished(id, new Date());
    return { project: published, url: `/sites/${published.slug}` };
  }

  private async nextAvailableCopySlug(sourceSlug: string): Promise<string> {
    for (let attempt = 1; ; attempt += 1) {
      const suffix = attempt === 1 ? "-copy" : `-copy-${attempt}`;
      const candidate = withCopySuffix(sourceSlug, suffix);
      if (await this.repository.findBySlug(candidate) === null) {
        return candidate;
      }
    }
  }

  private toEditableProject(input: ProjectInputDto): EditableProject {
    try {
      const description = typeof input.description === "string" ? input.description.trim() : "";
      return {
        name: input.name,
        slug: input.slug,
        description: description.length > 0 ? description : null,
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
