import express from "express";

import authRoutes from "./authRoutes.js";
import assignmentRoutes from "./assignmentRoutes.js";
import classRoutes from "./classRoutes.js";
import leaderboardRoutes from "./leaderboardRoutes.js";
import lessonRoutes from "./lessonRoutes.js";
import progressRoutes from "./progressRoutes.js";
import resultRoutes from "./resultRoutes.js";
import reportRoutes from "./reportRoutes.js";
import settingsRoutes from "./settingsRoutes.js";
import studentRoutes from "./studentRoutes.js";

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
router.use("/assignments", assignmentRoutes);
router.use("/classes", classRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/lessons", lessonRoutes);
router.use("/progress", progressRoutes);
router.use("/results", resultRoutes);
router.use("/reports", reportRoutes);
router.use("/settings", settingsRoutes);
router.use("/students", studentRoutes);

export default router;
