import express from "express";
import rateLimit from "express-rate-limit";

import * as authController from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  findUsernameSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyAccountSchema,
} from "../validators/authValidators.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
      message: "Too many sign-in attempts. Please wait and try again.",
    },
  },
});

const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_RECOVERY_ATTEMPTS",
      message: "Too many account recovery attempts. Please wait and try again.",
    },
  },
});

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  authController.login,
);
router.post(
  "/register",
  loginLimiter,
  validate(registerSchema),
  authController.register,
);
router.post(
  "/find-username",
  recoveryLimiter,
  validate(findUsernameSchema),
  authController.findUsername,
);
router.post(
  "/verify-account",
  recoveryLimiter,
  validate(verifyAccountSchema),
  authController.verifyAccount,
);
router.post(
  "/reset-password",
  recoveryLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.post("/session", authController.restoreSession);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(logoutSchema), authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
