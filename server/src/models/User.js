import { ACTIVE_USER_STATUSES } from "@snp/shared";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const preferencesSchema = new mongoose.Schema(
  {
    soundEnabled: { type: Boolean, default: true },
    soundStyle: { type: String, enum: ["soft", "thock", "mechanical", "typewriter", "bubble"], default: "soft" },
    soundVolume: { type: Number, min: 0, max: 1, default: 0.35 },
    virtualKeyboard: { type: Boolean, default: true },
    handGuide: { type: Boolean, default: true },
    keyboardLayout: { type: String, enum: ["en", "km"], default: "en" },
    fontSize: { type: String, enum: ["normal", "large"], default: "normal" },
    theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
    superGuest: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 64,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, trim: true, maxlength: 80, default: "" },
    khmerName: { type: String, trim: true, maxlength: 160, default: "" },
    studentId: { type: String, unique: true, sparse: true, trim: true },
    gender: { type: String, enum: ["female", "male", "other", "unspecified"], default: "unspecified" },
    dateOfBirth: { type: Date },
    avatar: { type: String, default: "" },
    status: {
      type: String,
      enum: ACTIVE_USER_STATUSES,
      default: "active",
      index: true,
    },
    securityQuestion: { type: String, trim: true, default: "" },
    securityAnswer: { type: String, trim: true, default: "", select: false },
    preferences: { type: preferencesSchema, default: () => ({}) },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, value) => {
        delete value._id;
        delete value.__v;
        delete value.passwordHash;
        delete value.securityAnswer;
        return value;
      },
    },
  },
);

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model("User", userSchema);
