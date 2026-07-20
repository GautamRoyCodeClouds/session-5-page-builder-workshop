import { Injectable } from "@nestjs/common";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { AppConfigService } from "../common/config/app-config.service";
import { isValidProjectId } from "../common/validation/project-id";
import type { ProjectDocument } from "./project-document";
import { renderProject } from "./render-project";

@Injectable()
export class PublisherService {
  constructor(private readonly config: AppConfigService) {}

  async publish(project: ProjectDocument): Promise<string> {
    const { root, target } = this.outputPath(project.id);

    await mkdir(root, { recursive: true });
    const temporary = join(root, `.${project.id}.${randomUUID()}.tmp`);

    try {
      await writeFile(temporary, renderProject(project, this.config.siteLanguage), {
        encoding: "utf8",
        flag: "wx"
      });
      await rename(temporary, target);
    } catch (error) {
      await unlink(temporary).catch(() => undefined);
      throw error;
    }

    return target;
  }

  async unpublish(projectId: string): Promise<void> {
    const { target } = this.outputPath(projectId);
    try {
      await unlink(target);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
        return;
      }
      throw error;
    }
  }

  private outputPath(projectId: string): { root: string; target: string } {
    if (!isValidProjectId(projectId)) {
      throw new Error("Invalid project ID");
    }

    const root = resolve(this.config.publishDir);
    const target = resolve(join(root, `${projectId}.html`));
    if (dirname(target) !== root || basename(target) !== `${projectId}.html`) {
      throw new Error("Published output must remain inside PUBLISH_DIR");
    }
    return { root, target };
  }
}
