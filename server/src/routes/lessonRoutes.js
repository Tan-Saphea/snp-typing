import express from "express";

import * as lessonController from "../controllers/lessonController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { listLessonsSchema } from "../validators/lessonValidators.js";

const router = express.Router();

router.use(authenticate);
router.get("/", validate(listLessonsSchema), lessonController.list);
router.get("/:lessonId", lessonController.getOne);

export default router;
