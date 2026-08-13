import { api } from "./api.js";

export async function savePreferences(preferences) {
  return (await api.patch("/settings/me", preferences)).data.data.user;
}

export async function getSchoolSettings() {
  return (await api.get("/settings/school")).data.data.settings;
}

export async function saveSchoolSettings(settings) {
  return (await api.patch("/settings/school", settings)).data.data.settings;
}
