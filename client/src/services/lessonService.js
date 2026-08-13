import { api } from "./api.js";

export async function listLessons(filters = {}) {
  const response = await api.get("/lessons", { params: filters });
  return response.data.data.lessons;
}

export async function getLesson(lessonId) {
  const response = await api.get(`/lessons/${lessonId}`);
  return response.data.data;
}
