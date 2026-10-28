
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createIssueSchema,
  updateIssueSchema,
  issueParamsSchema,
  projectIssueParamsSchema,
  issueQuerySchema,
  changeIssueStatusSchema,
} from "../validators/issue.validator.js";

import {
  createIssueController,
  getIssueController,
  updateIssueController,
  changeIssueStatusController,
  getIssueHistoryController,
  listProjectIssuesController,
} from "../controllers/issue.controller.js";

const router = Router();

// Every issue endpoint requires authentication.
router.use(requireAuth);

// POST /api/v1/issues
router.post(
  "/",
  validate(createIssueSchema),
  createIssueController
);

// GET /api/v1/issues/projects/:projectId
router.get(
  "/projects/:projectId",
  validate(projectIssueParamsSchema, "params"),
  validate(issueQuerySchema, "query"),
  listProjectIssuesController
);

// PATCH /api/v1/issues/:issueId/status
// Keep this route before the generic issue routes.
router.patch(
  "/:issueId/status",
  validate(issueParamsSchema, "params"),
  validate(changeIssueStatusSchema),
  changeIssueStatusController
);

// GET /api/v1/issues/:issueId/history
router.get(
  "/:issueId/history",
  validate(issueParamsSchema, "params"),
  getIssueHistoryController
);

// GET /api/v1/issues/:issueId
router.get(
  "/:issueId",
  validate(issueParamsSchema, "params"),
  getIssueController
);

// PATCH /api/v1/issues/:issueId
// Status is intentionally excluded from updateIssueSchema.
router.patch(
  "/:issueId",
  validate(issueParamsSchema, "params"),
  validate(updateIssueSchema),
  updateIssueController
);

export default router;
