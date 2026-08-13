import { api } from "./api.js";

export async function saveLessonResult(payload) {
  const response = await api.post("/results", payload);
  return response.data.data;
}
