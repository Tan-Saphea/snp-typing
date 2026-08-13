import express from "express";

import * as lessonController from "../controllers/lessonController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createLessonSchema, listLessonsSchema, manageLessonsSchema, reorderLessonsSchema, updateLessonSchema } from "../validators/lessonValidators.js";

const router = express.Router();

router.use(authenticate);
router.get("/manage", authorize("admin", "teacher"), validate(manageLessonsSchema), lessonController.manageList);
router.post("/reorder", authorize("admin", "teacher"), validate(reorderLessonsSchema), lessonController.reorder);
router.get("/manage/:lessonId", authorize("admin", "teacher"), lessonController.manageGetOne);
router.post("/", authorize("admin", "teacher"), validate(createLessonSchema), lessonController.create);
router.get("/", validate(listLessonsSchema), lessonController.list);
router.post("/:lessonId/duplicate", authorize("admin", "teacher"), lessonController.duplicate);
router.patch("/:lessonId", authorize("admin", "teacher"), validate(updateLessonSchema), lessonController.update);
router.delete("/:lessonId", authorize("admin", "teacher"), lessonController.archive);
router.get("/:lessonId", lessonController.getOne);

export default router;
