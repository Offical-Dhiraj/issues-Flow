
import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Issue from "../models/Issue.js";
import Project from "../models/Project.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getAuthorizedIssue(userId, issueId) {
  if (!mongoose.isValidObjectId(issueId)) {
    throw httpError(400, "Invalid issue ID.");
  }

  const issue = await Issue.findById(issueId)
    .select("_id project")
    .lean();

  if (!issue) {
    throw httpError(404, "Issue not found.");
  }

  const isMember = await Project.exists({
    _id: issue.project,
    members: userId,
  });

  if (!isMember) {
    throw httpError(403, "You do not have access to this issue.");
  }

  return issue;
}

export async function listIssueComments(userId, issueId) {
  const issue = await getAuthorizedIssue(userId, issueId);

  return Comment.find({ issue: issue._id })
    .populate("author", "name email")
    .sort({ createdAt: 1, _id: 1 })
    .lean();
}

export async function createIssueComment(userId, issueId, body) {
  const issue = await getAuthorizedIssue(userId, issueId);

  const [comment] = await Comment.create([
    {
      issue: issue._id,
      author: userId,
      body,
    },
  ]);

  return Comment.findById(comment._id)
    .populate("author", "name email")
    .lean();
}
