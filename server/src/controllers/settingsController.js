import { User } from "../models/User.js";
import { SchoolSetting } from "../models/SchoolSetting.js";
import { getSchoolSettings } from "../services/settingsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const updatePreferences = asyncHandler(async (request, response) => {
  const set = Object.fromEntries(Object.entries(request.validated.body).map(([key, value]) => [`preferences.${key}`, value]));
  const user = await User.findByIdAndUpdate(request.auth.userId, { $set: set }, { new: true, runValidators: true });
  response.status(200).json({ data: { user: user.toJSON() } });
});

export const getSchool = asyncHandler(async (_request, response) => {
  const settings = await getSchoolSettings();
  response.status(200).json({ data: { settings: settings.toObject() } });
});

export const updateSchool = asyncHandler(async (request, response) => {
  const settings = await SchoolSetting.findOneAndUpdate(
    { key: "default" },
    { $set: { ...request.validated.body, updatedBy: request.auth.userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  response.status(200).json({ data: { settings: settings.toObject() } });
});
