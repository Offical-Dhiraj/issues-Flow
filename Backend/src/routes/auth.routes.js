
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  login,
  logout,
  me,
} from "../controllers/auth.controller.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again later.",
  },
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
