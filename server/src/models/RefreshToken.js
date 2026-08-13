import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    createdByIp: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    revokedAt: { type: Date },
    replacedByTokenHash: { type: String },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
