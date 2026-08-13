import ApiError from "../utils/ApiError.js";

export function validate(schema) {
  return function validationMiddleware(request, _response, next) {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(
        new ApiError(400, "VALIDATION_ERROR", "Please check the submitted information.", details),
      );
    }

    request.validated = result.data;
    return next();
  };
}
