import { api } from "./api.js";

export async function getMyProgress() {
  const response = await api.get("/progress/me");
  return response.data.data;
}
