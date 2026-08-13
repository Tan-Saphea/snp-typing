import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    level: { type: String, required: true, trim: true, maxlength: 80 },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    academicYear: { type: String, required: true, trim: true, maxlength: 20 },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
    freePracticeMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

classSchema.index({ teacher: 1, name: 1, academicYear: 1 }, { unique: true });

export const Class = mongoose.model("Class", classSchema);
