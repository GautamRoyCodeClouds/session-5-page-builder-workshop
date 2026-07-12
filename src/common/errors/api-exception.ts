import { HttpException, HttpStatus } from "@nestjs/common";

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

export class ApiException extends HttpException {
  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    const response: ApiErrorBody = { statusCode, code, message };
    if (details !== undefined) {
      response.details = details;
    }
    super(response, statusCode);
  }
}

const codeByStatus: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT"
};

function codeForStatus(statusCode: number): string {
  return codeByStatus[statusCode] ?? "HTTP_ERROR";
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<ApiErrorBody>;
  return typeof candidate.statusCode === "number"
    && typeof candidate.code === "string"
    && typeof candidate.message === "string";
}

export function normalizeException(exception: unknown): ApiErrorBody {
  if (!(exception instanceof HttpException)) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error"
    };
  }

  const statusCode = exception.getStatus();
  const response = exception.getResponse();
  if (isApiErrorBody(response)) {
    return response;
  }

  if (typeof response === "string") {
    return { statusCode, code: codeForStatus(statusCode), message: response };
  }

  const body = response as { message?: unknown };
  if (Array.isArray(body.message)) {
    return {
      statusCode,
      code: codeForStatus(statusCode),
      message: "Request validation failed",
      details: body.message
    };
  }

  return {
    statusCode,
    code: codeForStatus(statusCode),
    message: typeof body.message === "string" ? body.message : exception.message
  };
}
