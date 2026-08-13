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

export const manageList = asyncHandler(async (request, response) => {
  const data = await lessonService.listManagedLessons(request.validated.query);
  response.status(200).json({ data });
});

export const manageGetOne = asyncHandler(async (request, response) => {
  response.status(200).json({ data: { lesson: await lessonService.getManagedLesson(request.params.lessonId) } });
});

export const create = asyncHandler(async (request, response) => {
  const lesson = await lessonService.createLesson(request.validated.body, request.auth.userId);
  response.status(201).json({ data: { lesson } });
});

export const update = asyncHandler(async (request, response) => {
  const lesson = await lessonService.updateLesson(request.params.lessonId, request.validated.body, request.auth.userId);
  response.status(200).json({ data: { lesson } });
});

export const archive = asyncHandler(async (request, response) => {
  const lesson = await lessonService.archiveLesson(request.params.lessonId, request.auth.userId);
  response.status(200).json({ data: { lesson } });
});

export const duplicate = asyncHandler(async (request, response) => {
  const lesson = await lessonService.duplicateLesson(request.params.lessonId, request.auth.userId);
  response.status(201).json({ data: { lesson } });
});

export const reorder = asyncHandler(async (request, response) => {
  const lessons = await lessonService.reorderLessons(request.validated.body.items, request.auth.userId);
  response.status(200).json({ data: { lessons: lessons.map(lessonService.lessonToJSON) } });
});
