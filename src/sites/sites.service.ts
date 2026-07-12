import { HttpStatus, Injectable } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { AppConfigService } from "../common/config/app-config.service";
import { ApiException } from "../common/errors/api-exception";
import { isValidProjectId } from "../common/validation/project-id";
import { isValidSlug } from "../common/validation/slug";
import { ProjectsRepository } from "../projects/projects.repository";

@Injectable()
export class SitesService {
  constructor(
    private readonly config: AppConfigService,
    private readonly projects: ProjectsRepository
  ) {}

  async read(slug: string): Promise<string> {
    if (!isValidSlug(slug)) {
      this.throwNotFound();
    }

    const project = await this.projects.findBySlug(slug);
    if (project === null || project.publishedAt === null || !isValidProjectId(project.id)) {
      this.throwNotFound();
    }

    const root = resolve(this.config.publishDir);
    try {
      return await readFile(join(root, `${project.id}.html`), "utf8");
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
        this.throwNotFound();
      }
      throw error;
    }
  }

  private throwNotFound(): never {
    throw new ApiException(HttpStatus.NOT_FOUND, "SITE_NOT_FOUND", "Published site not found");
  }
}
