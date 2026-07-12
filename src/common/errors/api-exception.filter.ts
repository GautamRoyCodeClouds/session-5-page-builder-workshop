import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

import { normalizeException } from "./api-exception";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const body = normalizeException(exception);
    const response = host.switchToHttp().getResponse<Response>();
    // Routes such as GET /sites/:slug set a text/html content-type via @Header
    // before the handler runs. The error envelope is always JSON, so the filter
    // overrides any route-level content-type that was applied before the throw.
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.status(body.statusCode).json(body);
  }
}
