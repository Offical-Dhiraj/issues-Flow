
import mongoose from "mongoose";
import Issue from "../models/Issue.js";
import Project from "../models/Project.js";
import IssueHistory from "../models/IssueHistory.js";

const ALLOWED_TRANSITIONS = Object.freeze({
  open: ["in_progress"],
  in_progress: ["in_review"],
  in_review: ["closed"],
  closed: ["open"],
});

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function hasTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeValue(field, value) {
  if (field === "assignee" && value != null) {
    return value.toString();
  }

  if (field === "labels") {
    return [...(value ?? [])];
  }

  return value ?? null;
}

export async function changeIssueStatus(userId, issueId, nextStatus) {
  if (!mongoose.isValidObjectId(issueId)) {
    throw httpError(400, "Invalid issue ID.");
  }

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const issue = await Issue.findById(issueId).session(session);

      if (!issue) {
        throw httpError(404, "Issue not found.");
      }

      const project = await Project.findOne({
        _id: issue.project,
        members: userId,
      }).session(session);

      if (!project) {
        throw httpError(403, "You do not have access to this issue.");
      }

      const previousStatus = issue.status;

      if (!hasTransition(previousStatus, nextStatus)) {
        throw httpError(
          400,
          `Invalid status transition: ${previousStatus} -> ${nextStatus}.`
        );
      }

      const updated = await Issue.findOneAndUpdate(
        {
          _id: issue._id,
          status: previousStatus,
          __v: issue.__v,
        },
        {
          $set: { status: nextStatus },
          $inc: { __v: 1 },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!updated) {
        throw httpError(
          409,
          "Issue changed concurrently. Reload and try again."
        );
      }

      await IssueHistory.create(
        [
          {
            issue: issue._id,
            actor: userId,
            field: "status",
            from: previousStatus,
            to: nextStatus,
          },
        ],
        { session }
      );

      result = updated;
    });

    return result;
  } finally {
    await session.endSession();
  }
}

export async function updateIssueWithHistory(userId, issueId, changes) {
  const allowedFields = [
    "title",
    "description",
    "type",
    "priority",
    "labels",
    "assignee",
  ];

  const requestedFields = Object.keys(changes);

  if (
    requestedFields.length === 0 ||
    requestedFields.some((field) => !allowedFields.includes(field))
  ) {
    throw httpError(400, "Invalid issue update fields.");
  }

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const issue = await Issue.findById(issueId).session(session);

      if (!issue) {
        throw httpError(404, "Issue not found.");
      }

      const project = await Project.findOne({
        _id: issue.project,
        members: userId,
      }).session(session);

      if (!project) {
        throw httpError(403, "You do not have access to this issue.");
      }

      if (Object.hasOwn(changes, "assignee") && changes.assignee != null) {
        const isMember = project.members.some(
          (memberId) => memberId.toString() === changes.assignee.toString()
        );

        if (!isMember) {
          throw httpError(400, "Assignee must be a project member.");
        }
      }

      const historyEntries = [];

      for (const field of requestedFields) {
        const from = normalizeValue(field, issue[field]);
        const to = normalizeValue(field, changes[field]);

        if (!sameValue(from, to)) {
          historyEntries.push({
            issue: issue._id,
            actor: userId,
            field,
            from,
            to,
          });
        }
      }

      if (historyEntries.length === 0) {
        result = issue;
        return;
      }

      const updated = await Issue.findOneAndUpdate(
        {
          _id: issue._id,
          __v: issue.__v,
        },
        {
          $set: changes,
          $inc: { __v: 1 },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!updated) {
        throw httpError(
          409,
          "Issue changed concurrently. Reload and try again."
        );
      }

      await IssueHistory.insertMany(historyEntries, { session });

      result = updated;
    });

    return result;
  } finally {
    await session.endSession();
  }
}

export async function getIssueHistory(userId, issueId) {
  const issue = await Issue.findById(issueId).select("project").lean();

  if (!issue) {
    throw httpError(404, "Issue not found.");
  }

  const member = await Project.exists({
    _id: issue.project,
    members: userId,
  });

  if (!member) {
    throw httpError(403, "You do not have access to this issue.");
  }

  return IssueHistory.find({ issue: issueId })
    .populate("actor", "name email")
    .sort({ createdAt: 1, _id: 1 })
    .lean();
}
