import express from "express";

import * as progressController from "../controllers/progressController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.use(authenticate);
router.get("/me", progressController.me);

export default router;
