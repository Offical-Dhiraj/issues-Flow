
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createIssueSchema,
  updateIssueSchema,
  issueParamsSchema,
  projectIssueParamsSchema,
  issueQuerySchema,
} from "../validators/issue.validator.js";

import {
  createIssueController,
  getIssueController,
  updateIssueController,
  listProjectIssuesController,
} from "../controllers/issue.controller.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  validate(createIssueSchema),
  createIssueController
);

router.get(
  "/projects/:projectId",
  validate(projectIssueParamsSchema, "params"),
  validate(issueQuerySchema, "query"),
  listProjectIssuesController
);

router.get(
  "/:issueId",
  validate(issueParamsSchema, "params"),
  getIssueController
);

router.patch(
  "/:issueId",
  validate(issueParamsSchema, "params"),
  validate(updateIssueSchema),
  updateIssueController
);

export default router;
