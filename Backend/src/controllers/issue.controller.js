
import {
  createIssue,
  getIssue,
  updateIssue,
  listProjectIssues,
} from "../services/issue.service.js";

export async function createIssueController(req, res) {
  const issue = await createIssue(req.user.id, req.body);

  return res.status(201).json({
    success: true,
    message: "Issue created successfully.",
    data: { issue },
  });
}

export async function getIssueController(req, res) {
  const issue = await getIssue(req.user.id, req.params.issueId);

  return res.status(200).json({
    success: true,
    data: { issue },
  });
}

export async function updateIssueController(req, res) {
  const issue = await updateIssue(
    req.user.id,
    req.params.issueId,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Issue updated successfully.",
    data: { issue },
  });
}

export async function listProjectIssuesController(req, res) {
  const result = await listProjectIssues(
    req.user.id,
    req.params.projectId,
    req.query
  );

  return res.status(200).json({
    success: true,
    data: result.issues,
    pagination: result.pagination,
  });
}
