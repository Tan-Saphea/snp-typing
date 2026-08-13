import mongoose from "mongoose";

const schoolSettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    minimumPassingAccuracy: { type: Number, min: 0, max: 100, default: 70 },
    showLiveWpm: { type: Boolean, default: true },
    allowTypingGames: { type: Boolean, default: true },
    lessonUnlocking: { type: Boolean, default: true },
    leaderboardVisibility: { type: String, enum: ["school", "class", "hidden"], default: "school" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const SchoolSetting = mongoose.model("SchoolSetting", schoolSettingSchema);
