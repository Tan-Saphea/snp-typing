import mongoose from "mongoose";

import { env } from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export function notFoundHandler(request, _response, next) {
  next(
    new ApiError(
      404,
      "ROUTE_NOT_FOUND",
      `The API route ${request.method} ${request.originalUrl} does not exist.`,
    ),
  );
}

function normalizeError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error?.type === "entity.parse.failed") {
    return new ApiError(
      400,
      "INVALID_JSON",
      "The request body contains invalid JSON.",
    );
  }

  if (error?.type === "entity.too.large" || error?.status === 413) {
    return new ApiError(
      413,
      "PAYLOAD_TOO_LARGE",
      "The request body is larger than the allowed limit.",
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return new ApiError(
      400,
      "DATABASE_VALIDATION_ERROR",
      "The submitted information is invalid.",
      Object.values(error.errors).map((item) => ({
        field: item.path,
        message: item.message,
      })),
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return new ApiError(400, "INVALID_IDENTIFIER", "The requested identifier is invalid.");
  }

  if (error?.code === 11000) {
    return new ApiError(
      409,
      "DUPLICATE_RECORD",
      "A record with this information already exists.",
      Object.keys(error.keyPattern ?? {}).map((field) => ({ field })),
    );
  }

  if (
    Number.isInteger(error?.status) &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return new ApiError(
      error.status,
      "INVALID_REQUEST",
      error.message || "The request could not be accepted.",
    );
  }

  return new ApiError(500, "INTERNAL_SERVER_ERROR", "The server could not complete the request.");
}

export function errorHandler(error, request, response, _next) {
  const normalized = normalizeError(error);

  if (normalized.status >= 500) {
    console.error(`[${request.id}]`, error);
  }

  const payload = {
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
      requestId: request.id,
    },
  };

  if (env.NODE_ENV === "development" && normalized.status >= 500) {
    payload.error.stack = error.stack;
  }

  response.status(normalized.status).json(payload);
}
