import { LANGUAGES } from "@snp/shared";
import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["lesson", "test", "practice", "game"],
      default: "lesson",
      index: true,
    },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true, index: true },
    duration: { type: Number, required: true, min: 0 },
    totalCharacters: { type: Number, required: true, min: 0 },
    totalTyped: { type: Number, required: true, min: 0 },
    correctCharacters: { type: Number, required: true, min: 0 },
    incorrectCharacters: { type: Number, required: true, min: 0 },
    totalGraphemes: { type: Number, required: true, min: 0 },
    correctGraphemes: { type: Number, required: true, min: 0 },
    incorrectGraphemes: { type: Number, required: true, min: 0 },
    errors: { type: Number, required: true, min: 0 },
    wpm: { type: Number, required: true, min: 0 },
    approximateWpm: { type: Number, required: true, min: 0 },
    cpm: { type: Number, required: true, min: 0 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    score: { type: Number, required: true, min: 0, max: 1000 },
    stars: { type: Number, required: true, min: 0, max: 3 },
    passed: { type: Boolean, required: true, index: true },
    clientVersion: { type: String, default: "" },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
    toJSON: {
      virtuals: true,
      transform: (_document, value) => {
        delete value._id;
        delete value.__v;
        return value;
      },
    },
  },
);

resultSchema.index({ student: 1, completedAt: -1 });
resultSchema.index({ student: 1, lesson: 1, score: -1 });
export const Result = mongoose.model("Result", resultSchema);
