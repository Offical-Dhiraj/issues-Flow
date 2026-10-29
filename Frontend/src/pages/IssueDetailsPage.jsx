import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  Bug,
  Check,
  Clock3,
  MessageSquare,
  RefreshCw,
  Send,
  History,
  UserRound,
  CalendarDays,
  ListTodo,
  Users,
  ClipboardCheck,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import api from "../lib/api";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "closed", label: "Closed" },
];

const PRIORITIES = {
  low: "text-slate-500",
  medium: "text-sky-600 dark:text-sky-300",
  high: "text-orange-600 dark:text-orange-300",
  urgent: "text-rose-600 dark:text-rose-300",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#11141c] dark:text-slate-100";

function messageFrom(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function unwrapIssue(response) {
  return response?.data?.data?.issue ?? response?.data?.issue;
}

function unwrapProject(response) {
  return (
    response?.data?.data?.project ??
    response?.data?.project ??
    response?.data?.data
  );
}

function unwrapList(response, key) {
  const data = response?.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(response?.data?.[key])) return response.data[key];

  return [];
}

function getMemberId(member) {
  if (member == null) return "";
  if (typeof member === "string") return member;

  return String(member._id ?? member.id ?? "");
}

function getMemberName(member) {
  if (!member) return "Team member";
  if (typeof member === "string") return "Project member";

  return member.name || member.email || "Team member";
}

function StatusBadge({ status }) {
  const styles = {
    open: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
    in_progress:
      "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    in_review:
      "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
    closed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  };

  const label =
    STATUSES.find((item) => item.value === status)?.label ??
    status ??
    "Unknown";

  return (
    <span
      className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"
      }`}
    >
      {label}
    </span>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#11141b]">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
        <span className="text-violet-600 dark:text-violet-300">{icon}</span>
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function DetailRow({ label, icon, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function SmallLoading() {
  return (
    <p className="flex items-center gap-2 py-3 text-sm text-slate-500 dark:text-slate-400">
      <RefreshCw size={15} className="animate-spin" />
      Loading...
    </p>
  );
}

function InlineError({ message, retry }) {
  return (
    <div className="space-y-3">
      <p
        role="alert"
        className="break-words text-sm text-rose-600 dark:text-rose-300"
      >
        {message}
      </p>
      <button
        type="button"
        onClick={retry}
        className="text-sm font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-300"
      >
        Try again
      </button>
    </div>
  );
}

function ReportStatusBadge({ status }) {
  const styles = {
    pending:
      "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
    approved:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    changes_requested:
      "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  };

  const labels = {
    pending: "Pending review",
    approved: "Approved",
    changes_requested: "Changes requested",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"
      }`}
    >
      {labels[status] || status?.replaceAll("_", " ") || "Unknown"}
    </span>
  );
}

export default function IssueDetailsPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [pageError, setPageError] = useState("");

  const [reportSummary, setReportSummary] = useState("");
  const [testingNotes, setTestingNotes] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [workflowError, setWorkflowError] = useState("");

  // --------------------------------------------------
  // Issue details
  // --------------------------------------------------

  const issueQuery = useQuery({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      const response = await api.get(`/issues/${issueId}`);
      const issue = unwrapIssue(response);

      if (!issue?._id) {
        throw new Error("The server returned an unexpected issue response.");
      }

      return issue;
    },
    enabled: Boolean(issueId),
  });

  const issue = issueQuery.data;

  const projectId =
    typeof issue?.project === "object"
      ? getMemberId(issue.project)
      : String(issue?.project ?? "");

  // --------------------------------------------------
  // Project details and members
  // --------------------------------------------------

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return unwrapProject(response);
    },
    enabled: Boolean(projectId),
  });

  // --------------------------------------------------
  // Comments
  // --------------------------------------------------

  const commentsQuery = useQuery({
    queryKey: ["issue-comments", issueId],
    queryFn: async () => {
      const response = await api.get(`/issues/${issueId}/comments`);
      return unwrapList(response, "comments");
    },
    enabled: Boolean(issueId),
  });

  // --------------------------------------------------
  // Activity history
  // --------------------------------------------------

  const historyQuery = useQuery({
    queryKey: ["issue-history", issueId],
    queryFn: async () => {
      const response = await api.get(`/issues/${issueId}/history`);
      return unwrapList(response, "history");
    },
    enabled: Boolean(issueId),
  });

  // --------------------------------------------------
  // Completion reports
  // --------------------------------------------------

  const completionReportsQuery = useQuery({
    queryKey: ["completion-reports", issueId],
    queryFn: async () => {
      const response = await api.get(
        `/issues/${issueId}/completion-reports`
      );

      return unwrapList(response, "reports");
    },
    enabled: Boolean(issueId),
  });

  // --------------------------------------------------
  // Refresh related issue data
  // --------------------------------------------------

  const refreshIssueData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["issue", issueId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["issue-comments", issueId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["issue-history", issueId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["completion-reports", issueId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["issues"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      }),
    ]);
  };

  // --------------------------------------------------
  // Update issue status
  // --------------------------------------------------

  const statusMutation = useMutation({
    mutationFn: async (status) => {
      const response = await api.patch(`/issues/${issueId}/status`, {
        status,
      });

      const updated = unwrapIssue(response);

      if (!updated) {
        throw new Error("The server returned an unexpected response.");
      }

      return updated;
    },

    onSuccess: async (updatedIssue) => {
      queryClient.setQueryData(["issue", issueId], updatedIssue);
      setPageError("");
      await refreshIssueData();
    },

    onError: (error) => {
      setPageError(messageFrom(error));
    },
  });

  // --------------------------------------------------
  // Assign issue to a team member
  // --------------------------------------------------

  const assignmentMutation = useMutation({
    mutationFn: async (assigneeId) => {
      const response = await api.patch(`/issues/${issueId}`, {
        assignee: assigneeId || null,
      });

      const updated = unwrapIssue(response);

      if (!updated) {
        throw new Error("The server returned an unexpected response.");
      }

      return updated;
    },

    onSuccess: async (updatedIssue) => {
      queryClient.setQueryData(["issue", issueId], updatedIssue);
      setPageError("");
      await refreshIssueData();
    },

    onError: (error) => {
      setPageError(messageFrom(error));
    },
  });

  // --------------------------------------------------
  // Submit completion report
  // --------------------------------------------------

  const submitCompletionReportMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post(
        `/issues/${issueId}/completion-reports`,
        payload
      );

      return response.data;
    },

    onSuccess: async () => {
      setReportSummary("");
      setTestingNotes("");
      setWorkflowError("");

      await refreshIssueData();
      await completionReportsQuery.refetch();
    },

    onError: (error) => {
      setWorkflowError(messageFrom(error));
    },
  });

  // --------------------------------------------------
  // Review a completion report
  // --------------------------------------------------

  const reviewCompletionReportMutation = useMutation({
    mutationFn: async ({ reportId, decision, comment }) => {
      const response = await api.post(
        `/issues/${issueId}/completion-reports/${reportId}/review`,
        {
          decision,
          reviewComment: comment,
        }
      );

      return response.data;
    },

    onSuccess: async () => {
      setReviewComment("");
      setWorkflowError("");

      await refreshIssueData();
      await completionReportsQuery.refetch();
    },

    onError: (error) => {
      setWorkflowError(messageFrom(error));
    },
  });

  // --------------------------------------------------
  // Post a comment
  // --------------------------------------------------

  const commentMutation = useMutation({
    mutationFn: async (body) => {
      const response = await api.post(`/issues/${issueId}/comments`, {
        body,
      });

      return response.data;
    },

    onSuccess: async () => {
      setCommentText("");
      setCommentError("");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["issue-comments", issueId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["issue-history", issueId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },

    onError: (error) => {
      setCommentError(messageFrom(error));
    },
  });

  async function submitComment(event) {
    event.preventDefault();

    const body = commentText.trim();

    if (!body) {
      setCommentError("Write a comment before submitting.");
      return;
    }

    setCommentError("");
    commentMutation.mutate(body);
  }

  // --------------------------------------------------
  // Submit a completion report
  // --------------------------------------------------

  function submitCompletionReport(event) {
    event.preventDefault();

    const summary = reportSummary.trim();

    if (!summary) {
      setWorkflowError("Describe the work you completed before submitting.");
      return;
    }

    setWorkflowError("");

    submitCompletionReportMutation.mutate({
      summary,
      testingNotes: testingNotes.trim(),
    });
  }

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (issueQuery.isPending) {
    return (
      <div className="grid min-h-96 place-items-center text-sm text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-3">
          <RefreshCw size={18} className="animate-spin text-violet-500" />
          Loading issue details...
        </span>
      </div>
    );
  }

  // --------------------------------------------------
  // Error state
  // --------------------------------------------------

  if (issueQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
          <AlertCircle size={25} />
        </div>

        <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
          Couldn't open this issue
        </h1>

        <p className="mt-2 break-words text-sm text-slate-500 dark:text-slate-400">
          {messageFrom(issueQuery.error)}
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => issueQuery.refetch()}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Try again
          </button>

          <button
            onClick={() => navigate("/issues")}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-white/10"
          >
            Back to issues
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Derived issue information
  // --------------------------------------------------

  const reporter = issue.reporter;
  const assignee = issue.assignee;

  const members = Array.isArray(projectQuery.data?.members)
    ? projectQuery.data.members
    : [];

  const memberOptions = members
    .map((member) => {
      if (typeof member === "string") {
        return {
          id: member,
          name: "Project member",
        };
      }

      return {
        id: getMemberId(member),
        name: getMemberName(member),
      };
    })
    .filter((member) => member.id);

  const currentAssigneeId = getMemberId(assignee);

  if (
    currentAssigneeId &&
    !memberOptions.some((member) => member.id === currentAssigneeId)
  ) {
    memberOptions.push({
      id: currentAssigneeId,
      name: getMemberName(assignee),
    });
  }

  // --------------------------------------------------
  // Page UI
  // --------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Top navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/issues"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300"
        >
          <ArrowLeft size={17} />
          Back to issues
        </Link>

        <button
          type="button"
          onClick={() => {
            issueQuery.refetch();
            commentsQuery.refetch();
            historyQuery.refetch();
            completionReportsQuery.refetch();

            if (projectId) {
              projectQuery.refetch();
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Issue header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#11141b] sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {issue.type === "bug" ? (
            <Bug size={18} />
          ) : (
            <ListTodo size={18} />
          )}

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {issue.type === "bug" ? "Bug" : "Task"}
          </span>

          <span className="text-slate-300 dark:text-slate-600">/</span>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {String(issue._id || issueId).slice(-8).toUpperCase()}
          </span>

          <span className="ml-auto">
            <StatusBadge status={issue.status} />
          </span>
        </div>

        <h1 className="mt-5 break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {issue.title}
        </h1>

        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 dark:text-slate-300">
          {issue.description || "No description has been added to this issue."}
        </p>

        {Array.isArray(issue.labels) && issue.labels.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {issue.labels.map((label) => (
              <span
                key={label}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-white/[0.07] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Priority:
            </span>

            <span
              className={`font-semibold capitalize ${
                PRIORITIES[issue.priority] ||
                "text-slate-600 dark:text-slate-300"
              }`}
            >
              {issue.priority || "Not set"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="issue-status"
              className="text-sm text-slate-500 dark:text-slate-400"
            >
              Update status
            </label>

            <select
              id="issue-status"
              value={issue.status}
              disabled={statusMutation.isPending}
              onChange={(event) => {
                statusMutation.mutate(event.target.value);
              }}
              className={`${inputClass} w-auto min-w-36 disabled:opacity-60`}
            >
              {STATUSES.filter(
                (status) =>
                  status.value !== "closed" || issue.status === "closed"
              ).map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(pageError || statusMutation.isPending) && (
          <div
            role={pageError ? "alert" : "status"}
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              pageError
                ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                : "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"
            }`}
          >
            {pageError || "Updating issue status..."}
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          {/* Discussion */}
          <Panel
            title="Discussion and updates"
            icon={<MessageSquare size={18} />}
          >
            <form onSubmit={submitComment} className="space-y-3">
              <label htmlFor="issue-comment" className="sr-only">
                Write a comment
              </label>

              <textarea
                id="issue-comment"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Share progress, explain what you fixed, or leave an update for your team..."
                className={`${inputClass} resize-y leading-6`}
              />

              {commentError && (
                <p
                  role="alert"
                  className="text-sm text-rose-600 dark:text-rose-300"
                >
                  {commentError}
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Keep your team informed about progress and blockers.
                </p>

                <button
                  type="submit"
                  disabled={
                    commentMutation.isPending || !commentText.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {commentMutation.isPending ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}

                  {commentMutation.isPending ? "Sending..." : "Post update"}
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/[0.07]">
              <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Comments
              </h3>

              {commentsQuery.isPending ? (
                <SmallLoading />
              ) : commentsQuery.isError ? (
                <InlineError
                  message={messageFrom(commentsQuery.error)}
                  retry={() => commentsQuery.refetch()}
                />
              ) : commentsQuery.data.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
                  No updates yet. Post the first comment to keep your team
                  informed.
                </p>
              ) : (
                <div className="space-y-4">
                  {commentsQuery.data.map((comment) => {
                    const author =
                      comment.author || comment.user || comment.createdBy;

                    const content =
                      comment.body ?? comment.content ?? comment.text ?? "";

                    return (
                      <article
                        key={comment._id || comment.id}
                        className="rounded-xl border border-slate-100 p-4 dark:border-white/[0.07]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
                            {(author?.name || author?.email || "M")
                              .trim()
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {author?.name ||
                                  author?.email ||
                                  "Team member"}
                              </p>

                              <time className="text-xs text-slate-400">
                                {formatDate(comment.createdAt)}
                              </time>
                            </div>

                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {content}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>

          {/* Completion report and review workflow */}
          <Panel
            title="Completion report & review"
            icon={<ClipboardCheck size={18} />}
          >
            <div className="space-y-5">
              {issue.status === "in_progress" && (
                <form
                  onSubmit={submitCompletionReport}
                  className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-white/10"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Submit completed work
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Explain what you changed and how you verified it. The
                      backend must allow only the assigned member to submit a
                      report.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="completion-summary"
                      className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Work summary <span className="text-rose-500">*</span>
                    </label>

                    <textarea
                      id="completion-summary"
                      value={reportSummary}
                      onChange={(event) =>
                        setReportSummary(event.target.value)
                      }
                      rows={4}
                      maxLength={5000}
                      required
                      placeholder="Describe what you implemented, fixed, or completed..."
                      className={`${inputClass} resize-y leading-6`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="completion-testing"
                      className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Testing notes
                    </label>

                    <textarea
                      id="completion-testing"
                      value={testingNotes}
                      onChange={(event) =>
                        setTestingNotes(event.target.value)
                      }
                      rows={3}
                      maxLength={5000}
                      placeholder="Mention tests run, expected results, or anything the reviewer should verify..."
                      className={`${inputClass} resize-y leading-6`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      submitCompletionReportMutation.isPending ||
                      !reportSummary.trim()
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitCompletionReportMutation.isPending ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}

                    {submitCompletionReportMutation.isPending
                      ? "Submitting..."
                      : "Submit for review"}
                  </button>
                </form>
              )}

              {issue.status === "in_review" && (
                <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-400/20 dark:bg-violet-400/[0.06]">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-300"
                    />

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Waiting for owner review
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        The project owner can approve the latest report to
                        close this issue or request changes to send it back to
                        in progress.
                      </p>
                    </div>
                  </div>

                  <label
                    htmlFor="review-comment"
                    className="mb-1.5 mt-4 block text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    Review feedback
                  </label>

                  <textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(event) =>
                      setReviewComment(event.target.value)
                    }
                    rows={3}
                    maxLength={3000}
                    placeholder="Optional for approval; required when requesting changes..."
                    className={`${inputClass} resize-y leading-6`}
                  />
                </div>
              )}

              {workflowError && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                >
                  {workflowError}
                </p>
              )}

              {completionReportsQuery.isPending ? (
                <SmallLoading />
              ) : completionReportsQuery.isError ? (
                <InlineError
                  message={messageFrom(completionReportsQuery.error)}
                  retry={() => completionReportsQuery.refetch()}
                />
              ) : completionReportsQuery.data.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
                  No completion reports yet. When the assigned member finishes
                  the work, their report will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {completionReportsQuery.data.map((report) => {
                    const reportStatus = report.status || "pending";
                    const reportId = report._id || report.id;

                    return (
                      <article
                        key={reportId}
                        className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {report.submittedBy?.name ||
                                report.submittedBy?.email ||
                                "Team member"}
                            </p>

                            <time className="mt-1 block text-xs text-slate-400">
                              Submitted {formatDate(report.createdAt)}
                            </time>
                          </div>

                          <ReportStatusBadge status={reportStatus} />
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Work summary
                          </p>

                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">
                            {report.summary}
                          </p>
                        </div>

                        {report.testingNotes && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Testing notes
                            </p>

                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">
                              {report.testingNotes}
                            </p>
                          </div>
                        )}

                        {report.reviewComment && (
                          <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.04]">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              Reviewer feedback
                            </p>

                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-300">
                              {report.reviewComment}
                            </p>
                          </div>
                        )}

                        {issue.status === "in_review" &&
                          reportStatus === "pending" && (
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.07]">
                              <button
                                type="button"
                                disabled={
                                  reviewCompletionReportMutation.isPending
                                }
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Approve this completion report and close the issue?"
                                    )
                                  ) {
                                    reviewCompletionReportMutation.mutate({
                                      reportId,
                                      decision: "approve",
                                      comment: reviewComment.trim(),
                                    });
                                  }
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                              >
                                {reviewCompletionReportMutation.isPending ? (
                                  <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={15} />
                                )}
                                Approve & close
                              </button>

                              <button
                                type="button"
                                disabled={
                                  reviewCompletionReportMutation.isPending ||
                                  !reviewComment.trim()
                                }
                                onClick={() => {
                                  reviewCompletionReportMutation.mutate({
                                    reportId,
                                    decision: "request_changes",
                                    comment: reviewComment.trim(),
                                  });
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-3.5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-400/20 dark:text-amber-300 dark:hover:bg-amber-400/10"
                              >
                                <XCircle size={15} />
                                Request changes
                              </button>
                            </div>
                          )}
                      </article>
                    );
                  })}
                </div>
              )}

              <p className="text-xs leading-5 text-slate-400">
                The backend must verify permissions for report submission and
                review. Frontend visibility is not a security boundary.
              </p>
            </div>
          </Panel>

          {/* Activity history */}
          <Panel title="Activity history" icon={<History size={18} />}>
            {historyQuery.isPending ? (
              <SmallLoading />
            ) : historyQuery.isError ? (
              <InlineError
                message={messageFrom(historyQuery.error)}
                retry={() => historyQuery.refetch()}
              />
            ) : historyQuery.data.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No activity history is available yet.
              </p>
            ) : (
              <div className="space-y-4">
                {historyQuery.data.map((entry) => (
                  <div
                    key={entry._id || entry.id}
                    className="flex gap-3"
                  >
                    <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                      <History size={15} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-semibold">
                          {entry.actor?.name ||
                            entry.actor?.email ||
                            "A team member"}
                        </span>{" "}
                        {entry.field
                          ? `updated ${entry.field.replaceAll("_", " ")}`
                          : "made an update"}
                      </p>

                      {(entry.from !== undefined ||
                        entry.to !== undefined) && (
                        <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                          {entry.from == null
                            ? "Empty"
                            : String(entry.from)}
                          {" → "}
                          {entry.to == null ? "Empty" : String(entry.to)}
                        </p>
                      )}

                      <time className="mt-1 block text-xs text-slate-400">
                        {formatDate(entry.createdAt)}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Panel title="Issue details" icon={<ListTodo size={18} />}>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <UserRound
                  size={16}
                  className="mt-1 text-slate-400"
                />

                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="issue-assignee"
                    className="text-xs text-slate-500 dark:text-slate-400"
                  >
                    Assigned to
                  </label>

                  {projectQuery.isPending ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Loading team members...
                    </p>
                  ) : projectQuery.isError ? (
                    <div className="mt-2">
                      <p className="text-sm text-rose-500">
                        Couldn't load project members.
                      </p>

                      <button
                        type="button"
                        onClick={() => projectQuery.refetch()}
                        className="mt-1 text-xs font-semibold text-violet-600"
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <select
                      id="issue-assignee"
                      value={currentAssigneeId}
                      disabled={assignmentMutation.isPending}
                      onChange={(event) =>
                        assignmentMutation.mutate(event.target.value)
                      }
                      className={`${inputClass} mt-2`}
                    >
                      <option value="">Unassigned</option>

                      {memberOptions.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {assignmentMutation.isPending && (
                    <p className="mt-2 text-xs text-violet-500">
                      Saving assignment...
                    </p>
                  )}

                  {assignmentMutation.isError && (
                    <p className="mt-2 text-xs text-rose-500">
                      {messageFrom(assignmentMutation.error)}
                    </p>
                  )}
                </div>
              </div>

              <DetailRow
                label="Reported by"
                icon={<UserRound size={16} />}
                value={reporter?.name || reporter?.email || "Unknown"}
              />

              <DetailRow
                label="Created"
                icon={<CalendarDays size={16} />}
                value={formatDate(issue.createdAt)}
              />

              <DetailRow
                label="Last updated"
                icon={<Clock3 size={16} />}
                value={formatDate(issue.updatedAt)}
              />
            </div>
          </Panel>

          {/* Workflow guide */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5 dark:border-violet-400/15 dark:bg-violet-400/[0.06]">
            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <Users size={18} />
              <h3 className="text-sm font-semibold">Team workflow</h3>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The assigned member completes the task and submits a completion
              report. The project owner reviews the report, approves it to
              close the issue, or requests changes.
            </p>

            <div className="mt-4 space-y-3">
              {STATUSES.map((status, index) => {
                const isCurrent = issue.status === status.value;

                return (
                  <div
                    key={status.value}
                    className="flex items-center gap-2.5 text-xs"
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                        isCurrent
                          ? "bg-violet-600 text-white"
                          : "bg-white text-slate-400 dark:bg-white/5 dark:text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <span
                      className={
                        isCurrent
                          ? "font-semibold text-violet-700 dark:text-violet-300"
                          : "text-slate-500 dark:text-slate-400"
                      }
                    >
                      {status.label}
                    </span>

                    {isCurrent && (
                      <span className="ml-auto text-violet-600 dark:text-violet-300">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}