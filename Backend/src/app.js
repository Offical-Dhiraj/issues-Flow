
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import { verifyRequestOrigin } from "./middleware/csrf.middleware.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/error.middleware.js";
import projectRoutes from "./routes/project.routes.js";
import issueRoutes from "./routes/issue.routes.js";

const app = express();

// Trust no proxy by default. Configure explicitly if deployed behind a proxy.
app.disable("x-powered-by");

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  })
);

// Request parsing
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// Parse signed authentication cookies
app.use(cookieParser(env.COOKIE_SECRET));

// General API rate limit
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "IssueFlow API is running",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

// Validate browser origins on state-changing requests.
// This is an additional CSRF defense, not a replacement for a CSRF token.
app.use("/api/v1", verifyRequestOrigin);

// Authentication routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/issues", issueRoutes);


// Handle unknown routes and errors last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
