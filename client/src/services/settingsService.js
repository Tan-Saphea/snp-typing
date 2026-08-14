import { api } from "./api.js";

export async function savePreferences(preferences) {
  return (await api.patch("/settings/me", preferences)).data.data.user;
}
