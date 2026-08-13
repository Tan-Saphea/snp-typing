import { Assignment } from "../models/Assignment.js";
import { Class } from "../models/Class.js";
import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function scope(request) {
  return request.auth.role === "admin" ? {} : { assignedBy: request.auth.userId };
}

async function assertOwnedTargets(request, input) {
  if (request.auth.role === "admin") return;
  const classIds = await Class.find({ teacher: request.auth.userId }).distinct("_id");
  const allowedIds = new Set(classIds.map((classId) => classId.toString()));
  if (input.class && !allowedIds.has(input.class)) {
    throw new ApiError(403, "CLASS_FORBIDDEN", "You can only assign work to your classes.");
  }
  if (input.students?.length) {
    const studentCount = await User.countDocuments({ _id: { $in: input.students }, role: "student", class: { $in: classIds } });
    if (studentCount !== input.students.length) throw new ApiError(403, "STUDENT_FORBIDDEN", "You can only assign work to students in your classes.");
  }
}

export const list = asyncHandler(async (request, response) => {
  const query = scope(request);
  if (request.validated.query.status) query.status = request.validated.query.status;
  if (request.validated.query.class) query.class = request.validated.query.class;
  if (request.validated.query.student) query.students = request.validated.query.student;
  const assignments = await Assignment.find(query).sort({ dueDate: 1 }).populate("lesson", "title language level type").populate("class", "name").populate("students", "firstName lastName studentId");
  response.status(200).json({ data: { assignments: assignments.map((item) => ({ ...item.toObject(), id: item.id })) } });
});

export const create = asyncHandler(async (request, response) => {
  const input = request.validated.body;
  await assertOwnedTargets(request, input);
  const assignment = await Assignment.create({ ...input, assignedBy: request.auth.userId, startDate: new Date(input.startDate), dueDate: new Date(input.dueDate) });
  response.status(201).json({ data: { assignment: { ...assignment.toObject(), id: assignment.id } } });
});

export const update = asyncHandler(async (request, response) => {
  await assertOwnedTargets(request, request.validated.body);
  const assignment = await Assignment.findOneAndUpdate({ _id: request.params.assignmentId, ...scope(request) }, { $set: request.validated.body }, { new: true, runValidators: true });
  if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "The assignment was not found.");
  response.status(200).json({ data: { assignment: { ...assignment.toObject(), id: assignment.id } } });
});

export const remove = asyncHandler(async (request, response) => {
  const assignment = await Assignment.findOneAndDelete({ _id: request.params.assignmentId, ...scope(request) });
  if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "The assignment was not found.");
  response.status(204).send();
});
