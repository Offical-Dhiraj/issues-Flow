
import {
  createProject,
  listMyProjects,
  getProject,
  updateProject,
  addProjectMember,
} from "../services/project.service.js";

export async function createProjectController(req, res) {
  const project = await createProject(req.user.id, req.body);

  return res.status(201).json({
    success: true,
    message: "Project created successfully.",
    data: { project },
  });
}

export async function listProjectsController(req, res) {
  const projects = await listMyProjects(req.user.id);

  return res.status(200).json({
    success: true,
    data: { projects },
  });
}

export async function getProjectController(req, res) {
  const project = await getProject(
    req.user.id,
    req.params.projectId
  );

  return res.status(200).json({
    success: true,
    data: { project },
  });
}

export async function updateProjectController(req, res) {
  const project = await updateProject(
    req.user.id,
    req.params.projectId,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Project updated successfully.",
    data: { project },
  });
}

export async function addProjectMemberController(req, res) {
  const project = await addProjectMember(
    req.user.id,
    req.params.projectId,
    req.body.userId
  );

  return res.status(200).json({
    success: true,
    message: "Project member added successfully.",
    data: { project },
  });
}
