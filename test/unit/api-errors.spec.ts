import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";

import { ApiException, normalizeException } from "../../src/common/errors/api-exception";

describe("normalizeException", () => {
  it("normalizes framework validation failures", () => {
    const result = normalizeException(new BadRequestException({
      statusCode: 400,
      error: "Bad Request",
      message: ["slug must be a lowercase slug"]
    }));

    expect(result).toEqual({
      statusCode: 400,
      code: "BAD_REQUEST",
      message: "Request validation failed",
      details: ["slug must be a lowercase slug"]
    });
  });

  it.each([
    [new NotFoundException("Missing"), 404, "NOT_FOUND", "Missing"],
    [new ConflictException("Already exists"), 409, "CONFLICT", "Already exists"]
  ])("normalizes an HTTP exception", (exception, statusCode, code, message) => {
    expect(normalizeException(exception)).toEqual({ statusCode, code, message });
  });

  it("preserves application error codes and details", () => {
    const exception = new ApiException(
      409,
      "SLUG_CONFLICT",
      "That slug is already in use",
      { slug: "existing" }
    );

    expect(normalizeException(exception)).toEqual({
      statusCode: 409,
      code: "SLUG_CONFLICT",
      message: "That slug is already in use",
      details: { slug: "existing" }
    });
  });
});
