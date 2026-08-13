import bcrypt from "bcrypt";

import { env } from "../config/env.js";
import { Class } from "../models/Class.js";
import { User } from "../models/User.js";
import { revokeAllUserSessions } from "../services/authService.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function allowedClassIds(request) {
  if (request.auth.role === "admin") return null;
  const classes = await Class.find({ teacher: request.auth.userId }).select("_id").lean();
  return classes.map((item) => item._id);
}

async function assertAllowedClass(request, classId) {
  if (!classId || request.auth.role === "admin") return;
  const allowed = await Class.exists({ _id: classId, teacher: request.auth.userId });
  if (!allowed) throw new ApiError(403, "CLASS_FORBIDDEN", "You can only manage students in your classes.");
}

async function studentScope(request) {
  if (request.auth.role === "admin") return { role: "student" };
  const classIds = await allowedClassIds(request);
  return { role: "student", class: { $in: classIds } };
}

export const list = asyncHandler(async (request, response) => {
  const query = { role: "student" };
  const classIds = await allowedClassIds(request);
  if (classIds) query.class = { $in: classIds };
  if (request.validated.query.class) {
    await assertAllowedClass(request, request.validated.query.class);
    query.class = request.validated.query.class;
  }
  if (request.validated.query.status) query.status = request.validated.query.status;
  const students = await User.find(query).sort({ firstName: 1, lastName: 1 }).populate("class", "name level academicYear");
  response.status(200).json({ data: { students: students.map((item) => item.toJSON()) } });
});

export const create = asyncHandler(async (request, response) => {
  const input = request.validated.body;
  if (request.auth.role === "teacher" && !input.class) throw new ApiError(400, "CLASS_REQUIRED", "Choose one of your classes for this student.");
  await assertAllowedClass(request, input.class);
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const student = await User.create({ ...input, dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined, password: undefined, passwordHash, role: "student" });
  if (input.class) await Class.updateOne({ _id: input.class }, { $addToSet: { students: student.id } });
  response.status(201).json({ data: { student: student.toJSON() } });
});

export const update = asyncHandler(async (request, response) => {
  const input = request.validated.body;
  await assertAllowedClass(request, input.class);
  const existing = await User.findOne({ _id: request.params.studentId, ...(await studentScope(request)) });
  if (!existing) throw new ApiError(404, "STUDENT_NOT_FOUND", "The student was not found.");
  const student = await User.findByIdAndUpdate(existing.id, { $set: { ...input, ...(input.dateOfBirth ? { dateOfBirth: new Date(input.dateOfBirth) } : {}) } }, { new: true, runValidators: true });
  if (!student) throw new ApiError(404, "STUDENT_NOT_FOUND", "The student was not found.");
  if (input.class && input.class !== existing.class?.toString()) {
    if (existing.class) await Class.updateOne({ _id: existing.class }, { $pull: { students: existing.id } });
    await Class.updateOne({ _id: input.class }, { $addToSet: { students: existing.id } });
  }
  response.status(200).json({ data: { student: student.toJSON() } });
});

export const resetPassword = asyncHandler(async (request, response) => {
  const passwordHash = await bcrypt.hash(request.validated.body.password, env.BCRYPT_ROUNDS);
  const student = await User.findOneAndUpdate({ _id: request.params.studentId, ...(await studentScope(request)) }, { $set: { passwordHash, passwordChangedAt: new Date() } }, { new: true });
  if (!student) throw new ApiError(404, "STUDENT_NOT_FOUND", "The student was not found.");
  await revokeAllUserSessions(student.id);
  response.status(204).send();
});
