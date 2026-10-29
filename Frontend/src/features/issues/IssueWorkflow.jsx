import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  MessageSquare,
  Send,
  LoaderCircle,
} from "lucide-react";

import {
  getIssueComments,
  getIssueHistory,
  addIssueComment,
  changeIssueStatus,
} from "./workflow.api";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "closed", label: "Closed" },
];

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
}

export default function IssueWorkflow({ issue }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const issueId = issue._id;

  const commentsQuery = useQuery({
    queryKey: ["issue-comments", issueId],
    queryFn: () => getIssueComments(issueId),
    enabled: Boolean(issueId),
  });

  const historyQuery = useQuery({
    queryKey: ["issue-history", issueId],
    queryFn: () => getIssueHistory(issueId),
    enabled: Boolean(issueId),
  });

  async function refreshIssue() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] }),
      queryClient.invalidateQueries({ queryKey: ["issues"] }),
      queryClient.invalidateQueries({ queryKey: ["issue-history", issueId] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  }

  const statusMutation = useMutation({
    mutationFn: (status) => changeIssueStatus(issueId, status),
    onSuccess: refreshIssue,
    onError: (err) => setError(getErrorMessage(err)),
  });

  const commentMutation = useMutation({
    mutationFn: (content) => addIssueComment(issueId, content),
    onSuccess: async () => {
      setComment("");
      await queryClient.invalidateQueries({
        queryKey: ["issue-comments", issueId],
      });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function submitComment(event) {
    event.preventDefault();

    if (!comment.trim()) return;

    setError("");
    commentMutation.mutate(comment.trim());
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#12151d]">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Workflow
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Update progress and submit completed work for review.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={
                statusMutation.isPending ||
                issue.status === option.value
              }
              onClick={() => {
                setError("");
                statusMutation.mutate(option.value);
              }}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                issue.status === option.value
                  ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                  : "border-slate-200 text-slate-700 hover:border-violet-400 dark:border-white/10 dark:text-slate-300"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {statusMutation.isPending && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle size={15} className="animate-spin" />
            Updating status...
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#12151d]">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <MessageSquare size={19} />
          Discussion
        </h2>

        <div className="mt-5 space-y-4">
          {commentsQuery.isLoading && (
            <p className="text-sm text-slate-500">Loading comments...</p>
          )}

          {commentsQuery.isError && (
            <p className="text-sm text-rose-500">
              {getErrorMessage(commentsQuery.error)}
            </p>
          )}

          {(commentsQuery.data ?? []).map((item) => (
            <div
              key={item._id}
              className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.author?.name || item.user?.name || "Team member"}
                </span>

                <span className="text-xs text-slate-500">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : ""}
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                {item.content ?? item.body ?? item.text ?? ""}
              </p>
            </div>
          ))}

          {commentsQuery.isSuccess &&
            commentsQuery.data.length === 0 && (
              <p className="text-sm text-slate-500">
                No comments yet. Start the discussion.
              </p>
            )}
        </div>

        <form onSubmit={submitComment} className="mt-5 space-y-3">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Share progress, explain blockers, or report completed work..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-[#0c0f15] dark:text-white"
          />

          <button
            type="submit"
            disabled={commentMutation.isPending || !comment.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <Send size={16} />
            {commentMutation.isPending ? "Posting..." : "Post comment"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#12151d]">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Clock3 size={19} />
          Activity history
        </h2>

        <div className="mt-5 space-y-4">
          {historyQuery.isLoading && (
            <p className="text-sm text-slate-500">Loading activity...</p>
          )}

          {historyQuery.isError && (
            <p className="text-sm text-rose-500">
              {getErrorMessage(historyQuery.error)}
            </p>
          )}

          {(historyQuery.data ?? []).map((entry) => (
            <div
              key={entry._id}
              className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-0 dark:border-white/10"
            >
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-violet-500"
              />

              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>
                    {entry.actor?.name || "Team member"}
                  </strong>{" "}
                  changed {entry.field}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {entry.createdAt
                    ? new Date(entry.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>
            </div>
          ))}

          {historyQuery.isSuccess &&
            historyQuery.data.length === 0 && (
              <p className="text-sm text-slate-500">
                No activity recorded yet.
              </p>
            )}
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
}