import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const updatePreferences = asyncHandler(async (request, response) => {
  const set = Object.fromEntries(Object.entries(request.validated.body).map(([key, value]) => [`preferences.${key}`, value]));
  const user = await User.findByIdAndUpdate(request.auth.userId, { $set: set }, { new: true, runValidators: true });
  response.status(200).json({ data: { user: user.toJSON() } });
});
