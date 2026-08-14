import express from "express";

import authRoutes from "./authRoutes.js";
import leaderboardRoutes from "./leaderboardRoutes.js";
import lessonRoutes from "./lessonRoutes.js";
import progressRoutes from "./progressRoutes.js";
import resultRoutes from "./resultRoutes.js";
import settingsRoutes from "./settingsRoutes.js";

const router = express.Router();

router.get("/health", (_request, response) => {
  response.status(200).json({
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/lessons", lessonRoutes);
router.use("/progress", progressRoutes);
router.use("/results", resultRoutes);
router.use("/settings", settingsRoutes);

export default router;
