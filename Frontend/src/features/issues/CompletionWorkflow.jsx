
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MessageSquare,
  Send,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import api from "../../lib/api";

function getId(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id ?? value.id ?? "";
}

function getMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

const panelClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11141c]";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-[#0d1017] dark:text-white";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50";

export default function CompletionWorkflow({
  issue,
  currentUser,
  project,
}) {
  const queryClient = useQueryClient();
  const issueId = getId(issue);
  const userId = getId(currentUser);
  const ownerId = getId(project?.owner);
  const assigneeId = getId(issue?.assignee);

  const isOwner = Boolean(userId && ownerId && userId === ownerId);
  const isAssignee = Boolean(
    userId && assigneeId && userId === assigneeId
  );

  const [summary, setSummary] = useState("");
  const [testingNotes, setTestingNotes] = useState("");
  const [reviewComments, setReviewComments] = useState({});
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const reportsQuery = useQuery({
    queryKey: ["completion-reports", issueId],
    enabled: Boolean(issueId),
    queryFn: async () => {
      const response = await api.get(
        `/issues/${issueId}/completion-reports`
      );
      const data = response.data?.data ?? response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  async function refreshWorkflow() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["completion-reports", issueId] }),
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] }),
      queryClient.invalidateQueries({ queryKey: ["issues"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["issue-history", issueId] }),
    ]);
  }

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post(
        `/issues/${issueId}/completion-reports`,
        payload
      );
      return response.data;
    },
    onSuccess: async () => {
      setSummary("");
      setTestingNotes("");
      setErrorMessage("");
      setSuccessMessage("Report submitted. The issue is awaiting review.");
      await refreshWorkflow();
    },
    onError: (error) => {
      setErrorMessage(getMessage(error));
      setSuccessMessage("");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ reportId, decision, reviewComment }) => {
      const response = await api.post(
        `/issues/${issueId}/completion-reports/${reportId}/review`,
        { decision, reviewComment }
      );
      return response.data;
    },
    onSuccess: async () => {
      setFeedback("");
      setReviewComments({});
      setErrorMessage("");
      setSuccessMessage("Review submitted successfully.");
      await refreshWorkflow();
    },
    onError: (error) => {
      setErrorMessage(getMessage(error));
      setSuccessMessage("");
    },
  });

  const reports = reportsQuery.data ?? [];
  const pendingReport = reports.find((report) => report.status === "pending");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (summary.trim().length < 5) {
      setErrorMessage("Please provide a meaningful completion summary.");
      return;
    }

    submitMutation.mutate({
      summary: summary.trim(),
      testingNotes: testingNotes.trim(),
    });
  }

  function handleReview(report, decision) {
    const comment = (reviewComments[getId(report)] ?? "").trim();

    if (decision === "request_changes" && !comment) {
      setErrorMessage("Add feedback before requesting changes.");
      return;
    }

    if (
      !window.confirm(
        decision === "approve"
          ? "Approve this report and close the issue?"
          : "Request changes and return the issue to In Progress?"
      )
    ) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    reviewMutation.mutate({
      reportId: getId(report),
      decision,
      reviewComment: comment,
    });
  }

  const statusStyle = {
    pending:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    approved:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    changes_requested:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };

  return (
    <section className="space-y-5">
      <div className={panelClass}>
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
            <ClipboardCheck size={21} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Completion & review
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Submit evidence of completed work and track owner feedback.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-600 dark:text-rose-300"
          >
            <AlertCircle size={18} className="shrink-0" />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <p
            role="status"
            className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"
          >
            {successMessage}
          </p>
        )}

        {isAssignee &&
          ["in_progress", "in_review"].includes(issue?.status) &&
          !pendingReport && (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  What did you complete?
                </label>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  maxLength={5000}
                  rows={4}
                  required
                  placeholder="Describe the changes, files or functionality completed..."
                  className={fieldClass}
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {summary.length}/5000
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Testing notes
                </label>
                <textarea
                  value={testingNotes}
                  onChange={(event) => setTestingNotes(event.target.value)}
                  maxLength={5000}
                  rows={3}
                  placeholder="How did you test it? Any edge cases or limitations?"
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className={primaryButton}
              >
                <Send size={16} />
                {submitMutation.isPending
                  ? "Submitting..."
                  : "Submit for review"}
              </button>
            </form>
          )}

        {isAssignee && pendingReport && (
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="font-semibold text-slate-800 dark:text-white">
              Your report is awaiting owner review.
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You can submit another report after this one has been reviewed.
            </p>
          </div>
        )}

        {isOwner && !pendingReport && issue?.status !== "closed" && (
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            No report is waiting for review. The assigned member can submit one
            when the work is ready.
          </p>
        )}
      </div>

      <div className={panelClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Submitted reports
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Completion evidence and review decisions.
            </p>
          </div>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            {reports.length}
          </span>
        </div>

        {reportsQuery.isLoading && (
          <p className="py-6 text-sm text-slate-500">Loading reports...</p>
        )}

        {reportsQuery.isError && (
          <div className="rounded-xl bg-rose-500/5 p-3 text-sm text-rose-600 dark:text-rose-300">
            Could not load reports: {getMessage(reportsQuery.error)}
            <button
              type="button"
              onClick={() => reportsQuery.refetch()}
              className="ml-2 underline"
            >
              Retry
            </button>
          </div>
        )}

        {!reportsQuery.isLoading && reports.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center dark:border-white/10">
            <MessageSquare className="mx-auto mb-2 text-slate-400" size={24} />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              No completion reports yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Submitted reports will appear here.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {reports.map((report) => {
            const reportId = getId(report);
            const isPending = report.status === "pending";

            return (
              <article
                key={reportId}
                className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {report.submittedBy?.name || "Project member"}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusStyle[report.status] || statusStyle.pending
                    }`}
                  >
                    {(report.status || "pending").replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Submitted {formatDate(report.createdAt)}
                </p>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Work summary
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {report.summary}
                  </p>
                </div>

                {report.testingNotes && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Testing notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {report.testingNotes}
                    </p>
                  </div>
                )}

                {report.reviewComment && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Owner feedback
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                      {report.reviewComment}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Reviewed {formatDate(report.reviewedAt)}
                    </p>
                  </div>
                )}

                {isOwner && isPending && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-white/10">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Review feedback
                      <textarea
                        value={reviewComments[reportId] ?? ""}
                        onChange={(event) =>
                          setReviewComments((current) => ({
                            ...current,
                            [reportId]: event.target.value,
                          }))
                        }
                        rows={2}
                        maxLength={3000}
                        placeholder="Add feedback, or explain what needs to change..."
                        className={`${fieldClass} mt-2`}
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleReview(report, "approve")}
                        disabled={reviewMutation.isPending}
                        className={primaryButton}
                      >
                        <CheckCircle2 size={16} />
                        Approve & close
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleReview(report, "request_changes")
                        }
                        disabled={reviewMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/5 disabled:opacity-50 dark:text-rose-300"
                      >
                        <RotateCcw size={16} />
                        Request changes
                      </button>
                    </div>
                  </div>
                )}

                {isPending && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-300">
                    <Clock3 size={14} />
                    Waiting for project owner
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
