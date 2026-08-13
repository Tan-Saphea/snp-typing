import { api } from "./api.js";

export async function listManagedLessons(filters = {}) { return (await api.get("/lessons/manage", { params: filters })).data.data; }
export async function createManagedLesson(payload) { return (await api.post("/lessons", payload)).data.data.lesson; }
export async function updateManagedLesson(id, payload) { return (await api.patch(`/lessons/${id}`, payload)).data.data.lesson; }
export async function archiveManagedLesson(id) { return (await api.delete(`/lessons/${id}`)).data.data.lesson; }
export async function duplicateManagedLesson(id) { return (await api.post(`/lessons/${id}/duplicate`)).data.data.lesson; }
export async function reorderManagedLessons(items) { return (await api.post("/lessons/reorder", { items })).data.data.lessons; }

export async function listStudents(filters = {}) { return (await api.get("/students", { params: filters })).data.data.students; }
export async function createStudent(payload) { return (await api.post("/students", payload)).data.data.student; }
export async function updateStudent(id, payload) { return (await api.patch(`/students/${id}`, payload)).data.data.student; }
export async function resetStudentPassword(id, password) { await api.post(`/students/${id}/reset-password`, { password }); }

export async function listClasses() { return (await api.get("/classes")).data.data.classes; }
export async function createClass(payload) { return (await api.post("/classes", payload)).data.data.class; }
export async function updateClass(id, payload) { return (await api.patch(`/classes/${id}`, payload)).data.data.class; }

export async function listAssignments(filters = {}) { return (await api.get("/assignments", { params: filters })).data.data.assignments; }
export async function createAssignment(payload) { return (await api.post("/assignments", payload)).data.data.assignment; }
export async function updateAssignment(id, payload) { return (await api.patch(`/assignments/${id}`, payload)).data.data.assignment; }
export async function deleteAssignment(id) { await api.delete(`/assignments/${id}`); }

export async function getReport(filters = {}) { return (await api.get("/reports/summary", { params: filters })).data.data; }
