import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from "@nestjs/common";
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

import { ListProjectsQueryDto } from "./dto/list-projects-query.dto";
import { ProjectInputDto } from "./dto/project-input.dto";
import { ProjectListResponseDto } from "./dto/project-list-response.dto";
import { ProjectResponseDto } from "./dto/project-response.dto";
import { PublishResponseDto } from "./dto/publish-response.dto";
import type { ProjectEntity } from "./project.entity";
import { ProjectsService, type ProjectListResult, type PublishResult } from "./projects.service";
import { DeleteProjectDto } from "./dto/delete-project.dto";

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

  @Get()
  @ApiOkResponse({ description: "Projects listed", type: ProjectListResponseDto })
  @ApiBadRequestResponse({ description: "Invalid pagination parameters" })
  list(@Query() query: ListProjectsQueryDto): Promise<ProjectListResult> {
    return this.projects.list(query);
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

  @Post(":id/publish")
  @ApiCreatedResponse({ description: "Project published", type: PublishResponseDto })
  @ApiBadRequestResponse({ description: "Malformed project ID" })
  @ApiNotFoundResponse({ description: "Project not found" })
  publish(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string): Promise<PublishResult> {
    return this.projects.publish(id);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiBody({ type: DeleteProjectDto })
  @ApiNoContentResponse({ description: "Project deleted" })
  @ApiBadRequestResponse({ description: "Invalid delete confirmation" })
  @ApiNotFoundResponse({ description: "Project not found" })
  delete(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() input: DeleteProjectDto
  ): Promise<void> {
    return this.projects.delete(id, input);
  }
}
