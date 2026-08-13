import crypto from "node:crypto";

export function requestId(request, response, next) {
  request.id = request.get("x-request-id") || crypto.randomUUID();
  response.set("x-request-id", request.id);
  next();
}
