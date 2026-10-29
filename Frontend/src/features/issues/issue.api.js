
import api from "../../lib/api";

function extractIssue(payload) {
  const issue = payload?.data?.issue ?? payload?.issue;

  if (!issue) {
    throw new Error("The API returned an unexpected issue response.");
  }

  return issue;
}

export async function getIssues({
  projectId,
  status,
  priority,
  assignee,
  label,
  search,
  page = 1,
  limit = 50,
  sortBy = "createdAt",
  sortOrder = "desc",
} = {}) {
  if (!projectId) return [];

  const params = {
    page,
    limit,
    sortBy,
    sortOrder,
  };

  if (status && status !== "all") params.status = status;
  if (priority && priority !== "all") params.priority = priority;
  if (assignee) params.assignee = assignee;
  if (label) params.label = label;
  if (search?.trim()) params.search = search.trim();

  const response = await api.get(
    `/issues/projects/${encodeURIComponent(projectId)}`,
    { params }
  );

  const payload = response.data;
  const issues = payload?.data;

  if (!Array.isArray(issues)) {
    throw new Error("The API returned an unexpected issues response.");
  }

  return issues;
}

export async function createIssue(issueData) {
  const response = await api.post("/issues", issueData);
  return extractIssue(response.data);
}

export async function getIssueById(issueId) {
  const response = await api.get(
    `/issues/${encodeURIComponent(issueId)}`
  );

  return extractIssue(response.data);
}

export async function updateIssue(issueId, changes) {
  const response = await api.patch(
    `/issues/${encodeURIComponent(issueId)}`,
    changes
  );

  return extractIssue(response.data);
}

export async function changeIssueStatus(issueId, status) {
  const response = await api.patch(
    `/issues/${encodeURIComponent(issueId)}/status`,
    { status }
  );

  return extractIssue(response.data);
}

export async function getIssueHistory(issueId) {
  const response = await api.get(
    `/issues/${encodeURIComponent(issueId)}/history`
  );

  return response.data?.data?.history ?? [];
}

export async function getIssueComments(issueId) {
  const response = await api.get(
    `/issues/${encodeURIComponent(issueId)}/comments`
  );

  return response.data?.data?.comments ?? response.data?.data ?? [];
}

export async function createIssueComment(issueId, commentData) {
  const response = await api.post(
    `/issues/${encodeURIComponent(issueId)}/comments`,
    commentData
  );

  return response.data?.data?.comment ?? response.data?.data;
}
