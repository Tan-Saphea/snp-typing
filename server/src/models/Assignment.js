import { LANGUAGES } from "@snp/shared";
import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["student", "class"],
      required: true,
      index: true,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", index: true },
    activityType: {
      type: String,
      enum: ["lesson", "level", "test", "practice"],
      required: true,
      index: true,
    },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    language: { type: String, enum: Object.values(LANGUAGES) },
    level: { type: Number, min: 1, max: 20 },
    customText: { type: String, maxlength: 20000, default: "" },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "closed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

assignmentSchema.index({ class: 1, status: 1, dueDate: 1 });
assignmentSchema.index({ students: 1, status: 1, dueDate: 1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
