import { LANGUAGES, LESSON_TYPES } from "@snp/shared";
import mongoose from "mongoose";

const contentBlockSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: [
        "text",
        "items",
        "sentences",
        "paragraph",
        "story",
        "picture",
        "formatting",
      ],
      required: true,
    },
    text: { type: String },
    items: [{ type: String }],
    image: { type: String },
    answer: { type: String },
    question: { type: String },
    options: [{ type: String }],
  },
  { _id: false },
);

const sourceSchema = new mongoose.Schema(
  {
    sourceBook: { type: String, default: "" },
    sourceFile: { type: String, default: "" },
    sourcePage: { type: Number, min: 1 },
    sourceExercise: { type: String, default: "" },
    rawText: { type: String, default: "" },
    reviewStatus: {
      type: String,
      enum: [
        "pending-source",
        "extracted",
        "needs-review",
        "verified",
        "adapted",
        "approved",
        "rejected",
      ],
      default: "pending-source",
    },
    reviewNotes: { type: String, default: "" },
  },
  { _id: false },
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    titleKhmer: { type: String, trim: true, maxlength: 160, default: "" },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    slug: { type: String, required: true, unique: true, trim: true },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      required: true,
      index: true,
    },
    category: { type: String, required: true, trim: true, index: true },
    level: { type: Number, required: true, min: 1, max: 20, index: true },
    order: { type: Number, required: true, min: 1 },
    difficulty: {
      type: String,
      enum: ["beginner", "easy", "medium", "challenge", "advanced"],
      required: true,
    },
    type: { type: String, enum: LESSON_TYPES, required: true, index: true },
    instructions: { type: String, default: "" },
    contentItems: [{ type: String, maxlength: 2000 }],
    content: {
      blocks: { type: [contentBlockSchema], required: true },
      keyboardLayout: { type: String, enum: ["en", "km"] },
      durationOptions: [{ type: Number, min: 10, max: 3600 }],
    },
    source: { type: sourceSchema, default: () => ({}) },
    sourceBook: { type: String, trim: true, default: "" },
    sourcePage: { type: Number, min: 1 },
    sourceExercise: { type: String, trim: true, default: "" },
    contentStatus: {
      type: String,
      enum: ["verified", "needs_review", "custom"],
      default: "custom",
      index: true,
    },
    minimumAccuracy: { type: Number, min: 0, max: 100, default: 70 },
    minimumSpeed: { type: Number, min: 0, default: 0 },
    timeLimit: { type: Number, min: 0, default: 0 },
    starsEnabled: { type: Boolean, default: true },
    allowBackspace: { type: Boolean, default: true },
    isLocked: { type: Boolean, default: false },
    prerequisiteLesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    isPublished: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

lessonSchema.index(
  { language: 1, category: 1, level: 1, order: 1 },
  { unique: true },
);
lessonSchema.index({ language: 1, level: 1, isPublished: 1, isActive: 1 });

export const Lesson = mongoose.model("Lesson", lessonSchema);
