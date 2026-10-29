
import {
  submitCompletionReport,
  listCompletionReports,
  reviewCompletionReport,
} from "../services/completionReport.service.js";

const getAuthenticatedUser = (req) => {
  if (!req.user?._id && !req.user?.id) {
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  }

  return req.user;
};

const handleControllerError = (res, error) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error("Completion report error:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Something went wrong while processing the completion report."
        : error.message,
  });
};

// POST /api/v1/issues/:issueId/completion-reports
export const createCompletionReport = async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);

    const report = await submitCompletionReport(
      req.params.issueId,
      user,
      {
        summary: req.body.summary,
        testingNotes: req.body.testingNotes,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Completion report submitted for review.",
      data: { report },
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

// GET /api/v1/issues/:issueId/completion-reports
export const getCompletionReports = async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);

    const reports = await listCompletionReports(
      req.params.issueId,
      user
    );

    return res.status(200).json({
      success: true,
      data: { reports },
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

// POST /api/v1/issues/:issueId/completion-reports/:reportId/review
export const reviewCompletionReportController = async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);

    const report = await reviewCompletionReport(
      req.params.issueId,
      req.params.reportId,
      user,
      {
        decision: req.body.decision,
        reviewComment: req.body.reviewComment,
      }
    );

    const message =
      req.body.decision === "approve"
        ? "Completion report approved. Issue closed successfully."
        : "Changes requested. Issue returned to in-progress.";

    return res.status(200).json({
      success: true,
      message,
      data: { report },
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};
