
import mongoose from "mongoose";
import Issue from "../models/Issue.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function requireProjectMember(projectId, userId) {
  const project = await Project.findById(projectId).select("members");

  if (!project) {
    throw httpError(404, "Project not found.");
  }

  const member = project.members.some(
    (id) => id.toString() === userId
  );

  if (!member) {
    throw httpError(403, "You do not have access to this project.");
  }

  return project;
}

async function validateAssignee(project, assignee) {
  if (assignee == null) return;

  const isMember = project.members.some(
    (id) => id.toString() === assignee.toString()
  );

  if (!isMember) {
    throw httpError(400, "Assignee must be a member of this project.");
  }
}

export async function createIssue(userId, input) {
  const project = await requireProjectMember(input.project, userId);

  await validateAssignee(project, input.assignee);

  const issue = await Issue.create({
    ...input,
    project: project._id,
    reporter: userId,
    status: "open",
  });

  return Issue.findById(issue._id)
    .populate("reporter", "name email")
    .populate("assignee", "name email")
    .lean();
}

export async function getIssue(userId, issueId) {
  const issue = await Issue.findById(issueId)
    .populate("reporter", "name email")
    .populate("assignee", "name email")
    .lean();

  if (!issue) {
    throw httpError(404, "Issue not found.");
  }

  await requireProjectMember(issue.project, userId);

  return issue;
}

export async function updateIssue(userId, issueId, input) {
  const current = await Issue.findById(issueId);

  if (!current) {
    throw httpError(404, "Issue not found.");
  }

  const project = await requireProjectMember(current.project, userId);

  if (Object.hasOwn(input, "assignee")) {
    await validateAssignee(project, input.assignee);
  }

  // Status, project, and reporter are never accepted here.
  const updated = await Issue.findOneAndUpdate(
    {
      _id: current._id,
      __v: current.__v,
    },
    {
      $set: input,
      $inc: { __v: 1 },
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("reporter", "name email")
    .populate("assignee", "name email")
    .lean();

  if (!updated) {
    throw httpError(409, "Issue changed concurrently. Reload and retry.");
  }

  return updated;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listProjectIssues(userId, projectId, query) {
  await requireProjectMember(projectId, userId);

  const filter = { project: projectId };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignee) filter.assignee = query.assignee;
  if (query.label) filter.labels = query.label;

  if (query.search) {
    const safeSearch = escapeRegex(query.search);

    filter.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const sort = {
    [query.sortBy]: query.sortOrder === "asc" ? 1 : -1,
    _id: 1,
  };

  const skip = (query.page - 1) * query.limit;

  const [issues, total] = await Promise.all([
    Issue.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .populate("reporter", "name email")
      .populate("assignee", "name email")
      .lean(),

    Issue.countDocuments(filter),
  ]);

  return {
    issues,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
