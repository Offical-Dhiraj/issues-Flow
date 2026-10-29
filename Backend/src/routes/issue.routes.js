
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

import { createCommentSchema } from "../validators/comment.validator.js";

import {
  listIssueCommentsController,
  createIssueCommentController,
} from "../controllers/comment.controller.js";

import {
  completionReportParamsSchema,
  reviewCompletionReportParamsSchema,
  createCompletionReportSchema,
  reviewCompletionReportSchema,
} from "../validators/completionReport.validator.js";

import {
  createCompletionReport,
  getCompletionReports,
  reviewCompletionReportController,
} from "../controllers/completionReport.controller.js";

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

// POST /api/v1/issues/:issueId/completion-reports
router.post(
  "/:issueId/completion-reports",
  validate(completionReportParamsSchema, "params"),
  validate(createCompletionReportSchema),
  createCompletionReport
);

// GET /api/v1/issues/:issueId/completion-reports
router.get(
  "/:issueId/completion-reports",
  validate(completionReportParamsSchema, "params"),
  getCompletionReports
);

// POST /api/v1/issues/:issueId/completion-reports/:reportId/review
router.post(
  "/:issueId/completion-reports/:reportId/review",
  validate(reviewCompletionReportParamsSchema, "params"),
  validate(reviewCompletionReportSchema),
  reviewCompletionReportController
);

// PATCH /api/v1/issues/:issueId/status
router.patch(
  "/:issueId/status",
  validate(issueParamsSchema, "params"),
  validate(changeIssueStatusSchema),
  changeIssueStatusController
);

// GET /api/v1/issues/:issueId/comments
router.get(
  "/:issueId/comments",
  validate(issueParamsSchema, "params"),
  listIssueCommentsController
);

// POST /api/v1/issues/:issueId/comments
router.post(
  "/:issueId/comments",
  validate(issueParamsSchema, "params"),
  validate(createCommentSchema),
  createIssueCommentController
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
