import express from "express";

import * as resultController from "../controllers/resultController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createResultSchema, listResultsSchema } from "../validators/resultValidators.js";

const router = express.Router();

router.use(authenticate);
router.get("/", validate(listResultsSchema), resultController.list);
router.post("/", validate(createResultSchema), resultController.create);

export default router;
