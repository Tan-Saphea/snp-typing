import { Class } from "../models/Class.js";
import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function scope(request) {
  return request.auth.role === "admin" ? {} : { teacher: request.auth.userId };
}

export const list = asyncHandler(async (request, response) => {
  const classes = await Class.find(scope(request)).sort({ name: 1 }).populate("teacher", "firstName lastName").populate("students", "firstName lastName khmerName studentId status");
  response.status(200).json({ data: { classes: classes.map((item) => ({ ...item.toObject(), id: item.id })) } });
});

export const create = asyncHandler(async (request, response) => {
  const data = request.validated.body;
  const schoolClass = await Class.create({ ...data, teacher: request.auth.role === "admin" && data.teacher ? data.teacher : request.auth.userId });
  if (data.students?.length) await User.updateMany({ _id: { $in: data.students }, role: "student" }, { $set: { class: schoolClass.id } });
  response.status(201).json({ data: { class: { ...schoolClass.toObject(), id: schoolClass.id } } });
});

export const update = asyncHandler(async (request, response) => {
  const existing = await Class.findOne({ _id: request.params.classId, ...scope(request) });
  if (!existing) throw new ApiError(404, "CLASS_NOT_FOUND", "The class was not found.");
  const schoolClass = await Class.findByIdAndUpdate(existing.id, { $set: request.validated.body }, { new: true, runValidators: true });
  if (!schoolClass) throw new ApiError(404, "CLASS_NOT_FOUND", "The class was not found.");
  if (request.validated.body.students) {
    const removed = existing.students.filter((studentId) => !request.validated.body.students.includes(studentId.toString()));
    if (removed.length) await User.updateMany({ _id: { $in: removed }, class: existing.id }, { $unset: { class: 1 } });
    if (request.validated.body.students.length) await User.updateMany({ _id: { $in: request.validated.body.students }, role: "student" }, { $set: { class: existing.id } });
  }
  response.status(200).json({ data: { class: { ...schoolClass.toObject(), id: schoolClass.id } } });
});
