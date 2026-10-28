
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  projectParamsSchema,
} from "../validators/project.validator.js";

import {
  createProjectController,
  listProjectsController,
  getProjectController,
  updateProjectController,
  addProjectMemberController,
} from "../controllers/project.controller.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  validate(createProjectSchema),
  createProjectController
);

router.get("/", listProjectsController);

router.get(
  "/:projectId",
  validate(projectParamsSchema, "params"),
  getProjectController
);

router.patch(
  "/:projectId",
  validate(projectParamsSchema, "params"),
  validate(updateProjectSchema),
  updateProjectController
);

router.post(
  "/:projectId/members",
  validate(projectParamsSchema, "params"),
  validate(addMemberSchema),
  addProjectMemberController
);

export default router;
