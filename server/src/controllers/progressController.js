import { getUserProgress } from "../services/progressService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const me = asyncHandler(async (request, response) => {
  const progress = await getUserProgress(request.auth.userId);
  response.status(200).json({ data: progress });
});
