import { SchoolSetting } from "../models/SchoolSetting.js";

export async function getSchoolSettings() {
  return SchoolSetting.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}
