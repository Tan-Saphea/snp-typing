import express from "express";
import * as controller from "../controllers/settingsController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { preferencesSchema } from "../validators/settingsValidators.js";
const router = express.Router();
router.use(authenticate);
router.patch("/me", validate(preferencesSchema), controller.updatePreferences);
export default router;
