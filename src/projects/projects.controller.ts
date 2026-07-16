import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags
} from "@nestjs/swagger";

import { DeleteProjectDto } from "./dto/delete-project.dto";
import { ProjectInputDto } from "./dto/project-input.dto";
import { ProjectResponseDto } from "./dto/project-response.dto";
import { PublishResponseDto } from "./dto/publish-response.dto";
import type { ProjectEntity } from "./project.entity";
import { ProjectsService, type PublishResult } from "./projects.service";

@ApiTags("projects")
@Controller("api/projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @ApiBody({ type: ProjectInputDto })
  @ApiCreatedResponse({ description: "Project created", type: ProjectResponseDto })
  @ApiBadRequestResponse({ description: "Invalid project" })
  @ApiConflictResponse({ description: "Slug already in use" })
  create(@Body() input: ProjectInputDto): Promise<ProjectEntity> {
    return this.projects.create(input);
  }

  @Get(":id")
  @ApiOkResponse({ description: "Project loaded", type: ProjectResponseDto })
  @ApiBadRequestResponse({ description: "Malformed project ID" })
  @ApiNotFoundResponse({ description: "Project not found" })
  get(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string): Promise<ProjectEntity> {
    return this.projects.get(id);
  }

  @Put(":id")
  @ApiBody({ type: ProjectInputDto })
  @ApiOkResponse({ description: "Project replaced", type: ProjectResponseDto })
  @ApiBadRequestResponse({ description: "Invalid project" })
  @ApiNotFoundResponse({ description: "Project not found" })
  @ApiConflictResponse({ description: "Slug already in use" })
  update(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() input: ProjectInputDto
  ): Promise<ProjectEntity> {
    return this.projects.update(id, input);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: DeleteProjectDto })
  @ApiNoContentResponse({ description: "Project deleted" })
  @ApiBadRequestResponse({ description: "Malformed project ID or missing confirmation" })
  @ApiNotFoundResponse({ description: "Project not found" })
  async remove(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() confirmation: DeleteProjectDto
  ): Promise<void> {
    await this.projects.delete(id, confirmation.confirm);
  }

  @Post(":id/duplicate")
  @ApiCreatedResponse({ description: "Project duplicated", type: ProjectResponseDto })
  @ApiBadRequestResponse({ description: "Malformed project ID" })
  @ApiNotFoundResponse({ description: "Project not found" })
  duplicate(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string): Promise<ProjectEntity> {
    return this.projects.duplicate(id);
  }

  @Post(":id/publish")
  @ApiCreatedResponse({ description: "Project published", type: PublishResponseDto })
  @ApiBadRequestResponse({ description: "Malformed project ID" })
  @ApiNotFoundResponse({ description: "Project not found" })
  publish(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string): Promise<PublishResult> {
    return this.projects.publish(id);
  }
}
