export function asyncHandler(handler) {
  return function wrappedAsyncHandler(request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
