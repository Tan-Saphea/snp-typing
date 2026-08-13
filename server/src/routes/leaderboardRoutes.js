import express from "express";
import * as controller from "../controllers/leaderboardController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { leaderboardQuerySchema } from "../validators/managementValidators.js";
const router = express.Router();
router.use(authenticate);
router.get("/", validate(leaderboardQuerySchema), controller.list);
export default router;
