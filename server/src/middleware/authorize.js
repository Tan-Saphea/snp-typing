import ApiError from "../utils/ApiError.js";

export function authorize(...allowedRoles) {
  return function authorizationMiddleware(request, _response, next) {
    if (!request.auth || !allowedRoles.includes(request.auth.role)) {
      return next(
        new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action."),
      );
    }

    return next();
  };
}
