import api from "../../lib/api";

export async function getIssueDetails(issueId) {
  const response = await api.get(`/issues/${issueId}`);
  return response.data.data.issue;
}

export async function getIssueComments(issueId) {
  const response = await api.get(`/issues/${issueId}/comments`);

  const data = response.data.data;

  if (Array.isArray(data)) return data;
  return data?.comments ?? [];
}

export async function getIssueHistory(issueId) {
  const response = await api.get(`/issues/${issueId}/history`);

  const data = response.data.data;

  if (Array.isArray(data)) return data;
  return data?.history ?? [];
}

export async function addIssueComment(issueId, content) {
  const response = await api.post(`/issues/${issueId}/comments`, {
    content,
  });

  return response.data;
}

export async function changeIssueStatus(issueId, status) {
  const response = await api.patch(`/issues/${issueId}/status`, {
    status,
  });

  return response.data.data.issue;
}