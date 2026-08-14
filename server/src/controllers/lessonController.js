import * as lessonService from "../services/lessonService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (request, response) => {
  const lessons = await lessonService.listLessonsForUser(
    request.auth.user,
    request.validated.query,
  );
  response.status(200).json({ data: { lessons } });
});

export const getOne = asyncHandler(async (request, response) => {
  const data = await lessonService.getLessonForUser(
    request.auth.user,
    request.params.lessonId,
  );
  response.status(200).json({ data });
});
