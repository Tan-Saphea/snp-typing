import { api } from "./api.js";

export async function getLeaderboard(filters = {}) {
  return (await api.get("/leaderboard", { params: filters })).data.data;
}
