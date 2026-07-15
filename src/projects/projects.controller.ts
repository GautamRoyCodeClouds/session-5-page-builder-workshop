import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags
} from "@nestjs/swagger";

import { ProjectInputDto } from "./dto/project-input.dto";
import { ProjectListResponseDto } from "./dto/project-list-response.dto";
import { ProjectResponseDto } from "./dto/project-response.dto";
import { PublishResponseDto } from "./dto/publish-response.dto";
import type { ProjectEntity } from "./project.entity";
import { ProjectsService, type ProjectListResult, type PublishResult } from "./projects.service";

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
  @ApiQuery({ name: "page", description: "1-based page number, defaults to 1", required: false })
  @ApiQuery({ name: "pageSize", description: "Items per page, defaults to 20, capped at 50", required: false })
  @ApiOkResponse({ description: "Paginated project list", type: ProjectListResponseDto })
  @ApiBadRequestResponse({ description: "Noninteger or nonpositive page or pageSize" })
  list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ): Promise<ProjectListResult> {
    return this.projects.list(page, pageSize);
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
}
