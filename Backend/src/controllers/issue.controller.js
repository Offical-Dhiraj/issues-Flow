
import {
  createIssue,
  getIssue,
  listProjectIssues,
} from "../services/issue.service.js";

import {
  updateIssueWithHistory,
  changeIssueStatus,
  getIssueHistory,
} from "../services/workflow.service.js";

export async function createIssueController(req, res) {
  const issue = await createIssue(req.user.id, req.body);

  return res.status(201).json({
    success: true,
    message: "Issue created successfully.",
    data: { issue },
  });
}

export async function getIssueController(req, res) {
  const issue = await getIssue(
    req.user.id,
    req.params.issueId
  );

  return res.status(200).json({
    success: true,
    data: { issue },
  });
}

export async function updateIssueController(req, res) {
  const issue = await updateIssueWithHistory(
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

export async function changeIssueStatusController(req, res) {
  const issue = await changeIssueStatus(
    req.user.id,
    req.params.issueId,
    req.body.status
  );

  return res.status(200).json({
    success: true,
    message: "Issue status updated successfully.",
    data: { issue },
  });
}

export async function getIssueHistoryController(req, res) {
  const history = await getIssueHistory(
    req.user.id,
    req.params.issueId
  );

  return res.status(200).json({
    success: true,
    data: { history },
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
