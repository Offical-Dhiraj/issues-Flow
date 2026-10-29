import mongoose from "mongoose";

import Issue from "../models/Issue.js";
import Project from "../models/Project.js";
import IssueHistory from "../models/IssueHistory.js";
import CompletionReport from "../models/CompletionReport.js";

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
  }
}

const getId = (value) => {
  if (value == null) return "";

  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }

  return String(value);
};

const getUserId = (user) => getId(user?._id ?? user?.id);

function validateObjectId(id, label = "ID") {
  if (!mongoose.isValidObjectId(id)) {
    throw new ServiceError(`Invalid ${label}.`, 400);
  }
}

function requireText(value, label, maxLength) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ServiceError(`${label} is required.`, 400);
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw new ServiceError(
      `${label} cannot exceed ${maxLength} characters.`,
      400
    );
  }

  return trimmed;
}

async function getIssueAndProject(issueId, userId, session) {
  validateObjectId(issueId, "issue ID");

  if (!userId) {
    throw new ServiceError("Authentication required.", 401);
  }

  const issueQuery = Issue.findById(issueId);

  if (session) issueQuery.session(session);

  const issue = await issueQuery;

  if (!issue) {
    throw new ServiceError("Issue not found.", 404);
  }

  const projectQuery = Project.findById(getId(issue.project));

  if (session) projectQuery.session(session);

  const project = await projectQuery;

  if (!project) {
    throw new ServiceError("Project not found.", 404);
  }

  const isOwner = getId(project.owner) === userId;

  const isMember = (project.members || []).some(
    (member) => getId(member) === userId
  );

  if (!isOwner && !isMember) {
    throw new ServiceError(
      "You do not have permission to access this issue.",
      403
    );
  }

  return { issue, project, isOwner };
}

async function recordStatusChange(
  issue,
  actorId,
  previousStatus,
  nextStatus,
  session
) {
  if (previousStatus === nextStatus) return;

  const history = new IssueHistory({
    issue: issue._id,
    actor: actorId,
    field: "status",
    from: previousStatus,
    to: nextStatus,
  });

  await history.save(session ? { session } : undefined);
}

/**
 * Submit a completion report.
 *
 * Only the assigned project member can submit.
 * The issue moves from in_progress to in_review.
 */
export async function submitCompletionReport(issueId, user, input = {}) {
  const userId = getUserId(user);

  const summary = requireText(input.summary, "Work summary", 5000);
  const testingNotes =
    typeof input.testingNotes === "string"
      ? input.testingNotes.trim()
      : "";

  if (summary.length < 10) {
    throw new ServiceError(
      "Work summary must contain at least 10 characters.",
      400
    );
  }

  if (testingNotes.length > 5000) {
    throw new ServiceError(
      "Testing notes cannot exceed 5000 characters.",
      400
    );
  }

  validateObjectId(issueId, "issue ID");

  const session = await mongoose.startSession();

  try {
    let createdReport;

    await session.withTransaction(async () => {
      const { issue, isOwner } = await getIssueAndProject(
        issueId,
        userId,
        session
      );

      if (isOwner) {
        throw new ServiceError(
          "The project owner cannot submit a completion report for this issue.",
          403
        );
      }

      if (getId(issue.assignee) !== userId) {
        throw new ServiceError(
          "Only the assigned member can submit a completion report.",
          403
        );
      }

      if (issue.status !== "in_progress") {
        throw new ServiceError(
          "The issue must be in progress before submitting a completion report.",
          409
        );
      }

      const existingReport = await CompletionReport.findOne({
        issue: issue._id,
        status: "pending",
      }).session(session);

      if (existingReport) {
        throw new ServiceError(
          "A completion report is already awaiting review.",
          409
        );
      }

      const previousStatus = issue.status;

      issue.status = "in_review";
      await issue.save({ session });

      await recordStatusChange(
        issue,
        userId,
        previousStatus,
        issue.status,
        session
      );

      createdReport = new CompletionReport({
        issue: issue._id,
        submittedBy: userId,
        summary,
        testingNotes,
        status: "pending",
      });

      await createdReport.save({ session });
    });

    return createdReport;
  } finally {
    await session.endSession();
  }
}

/**
 * List completion reports.
 *
 * Project owners and project members can view reports.
 */
export async function listCompletionReports(issueId, user) {
  const userId = getUserId(user);

  const { issue } = await getIssueAndProject(issueId, userId);

  return CompletionReport.find({ issue: issue._id })
    .populate("submittedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Review a completion report.
 *
 * Only the project owner can approve or request changes.
 * Approval closes the issue.
 * Requesting changes moves it back to in_progress.
 */
export async function reviewCompletionReport(
  issueId,
  reportId,
  user,
  input = {}
) {
  const userId = getUserId(user);
  const decision = input.decision;

  if (!["approve", "request_changes"].includes(decision)) {
    throw new ServiceError(
      "Decision must be approve or request_changes.",
      400
    );
  }

  const reviewComment =
    typeof input.reviewComment === "string"
      ? input.reviewComment.trim()
      : "";

  if (reviewComment.length > 3000) {
    throw new ServiceError(
      "Review feedback cannot exceed 3000 characters.",
      400
    );
  }

  if (decision === "request_changes" && !reviewComment) {
    throw new ServiceError(
      "Please explain what changes are required.",
      400
    );
  }

  validateObjectId(issueId, "issue ID");
  validateObjectId(reportId, "report ID");

  const session = await mongoose.startSession();

  try {
    let reviewedReport;

    await session.withTransaction(async () => {
      const { issue, isOwner } = await getIssueAndProject(
        issueId,
        userId,
        session
      );

      if (!isOwner) {
        throw new ServiceError(
          "Only the project owner can review completion reports.",
          403
        );
      }

      if (issue.status !== "in_review") {
        throw new ServiceError(
          "The issue must be in review before the report can be reviewed.",
          409
        );
      }

      const report = await CompletionReport.findOne({
        _id: reportId,
        issue: issue._id,
      }).session(session);

      if (!report) {
        throw new ServiceError("Completion report not found.", 404);
      }

      if (report.status !== "pending") {
        throw new ServiceError(
          "This completion report has already been reviewed.",
          409
        );
      }

      const previousStatus = issue.status;

      report.status =
        decision === "approve" ? "approved" : "changes_requested";

      report.reviewedBy = userId;
      report.reviewComment = reviewComment;
      report.reviewedAt = new Date();

      issue.status = decision === "approve" ? "closed" : "in_progress";

      await report.save({ session });
      await issue.save({ session });

      await recordStatusChange(
        issue,
        userId,
        previousStatus,
        issue.status,
        session
      );

      reviewedReport = report;
    });

    return reviewedReport;
  } finally {
    await session.endSession();
  }
}