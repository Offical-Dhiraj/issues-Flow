
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Bug,
  CheckCircle2,
  CircleDot,
  Clock3,
  FolderKanban,
  ListTodo,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import api from "../lib/api";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "bg-sky-500",
    badge:
      "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
  },
  in_progress: {
    label: "In progress",
    color: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  },
  in_review: {
    label: "In review",
    color: "bg-violet-500",
    badge:
      "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  },
  closed: {
    label: "Closed",
    color: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
};

const PRIORITY_CONFIG = {
  low: "text-slate-500",
  medium: "text-sky-600 dark:text-sky-300",
  high: "text-orange-600 dark:text-orange-300",
  urgent: "text-rose-600 dark:text-rose-300",
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;

  return String(value._id ?? value.id ?? "");
}

function extractProjects(response) {
  const payload = response?.data;

  const candidates = [
    payload?.data?.projects,
    payload?.projects,
    payload?.data,
    payload,
  ];

  const projects = candidates.find(Array.isArray);

  if (!projects) {
    throw new Error("The projects API returned an unexpected response.");
  }

  return projects;
}

function extractIssues(response) {
  const payload = response?.data;

  const candidates = [
    payload?.data?.issues,
    payload?.issues,
    payload?.data,
    payload,
  ];

  const issues = candidates.find(Array.isArray);

  if (!issues) {
    throw new Error("The issues API returned an unexpected response.");
  }

  return {
    issues,
    pagination: payload?.pagination ?? payload?.data?.pagination ?? null,
  };
}

async function fetchProjects() {
  const response = await api.get("/projects");
  return extractProjects(response);
}

async function fetchProjectIssues(projectId) {
  const limit = 100;
  const firstResponse = await api.get(
    `/issues/projects/${projectId}`,
    {
      params: {
        page: 1,
        limit,
      },
    },
  );

  const firstPage = extractIssues(firstResponse);
  const allIssues = [...firstPage.issues];
  const totalPages = Number(firstPage.pagination?.totalPages || 1);

  // Fetch remaining pages so dashboard counts are not limited to page one.
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await api.get(`/issues/projects/${projectId}`, {
      params: { page, limit },
    });

    const result = extractIssues(response);
    allIssues.push(...result.issues);
  }

  return allIssues;
}

async function fetchDashboardData() {
  const projects = await fetchProjects();

  const projectResults = await Promise.all(
    projects.map(async (project) => {
      const projectId = getId(project);

      if (!projectId) {
        return { project, issues: [] };
      }

      const issues = await fetchProjectIssues(projectId);

      return { project, issues };
    }),
  );

  return {
    projects,
    projectResults,
    issues: projectResults.flatMap(({ project, issues }) =>
      issues.map((issue) => ({
        ...issue,
        projectName: project.name || "Untitled project",
        projectId: getId(project),
      })),
    ),
  };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDisplayName(user) {
  if (!user) return "Unassigned";
  if (typeof user === "string") return "Assigned member";

  return user.name || user.email || "Assigned member";
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function Panel({ title, subtitle, action, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#11141b]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 dark:border-white/[0.07] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function MetricCard({ title, value, subtitle, icon, tone }) {
  const tones = {
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/[0.08] dark:bg-[#11141b] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400 dark:text-slate-500">
        {subtitle}
      </p>
    </article>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    badge: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold ${config.badge}`}
    >
      {config.label}
    </span>
  );
}

function LoadingDashboard() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
    </div>
  );
}

function ErrorDashboard({ error, retry }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
        <AlertCircle size={25} />
      </div>

      <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
        Couldn't load your dashboard
      </h1>

      <p className="mt-2 break-words text-sm leading-6 text-slate-500 dark:text-slate-400">
        {getErrorMessage(error)}
      </p>

      <button
        type="button"
        onClick={retry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
      >
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    staleTime: 30_000,
    retry: 1,
  });

  const dashboard = dashboardQuery.data;

  const stats = useMemo(() => {
    const issues = dashboard?.issues ?? [];

    const open = issues.filter((issue) => issue.status === "open").length;
    const inProgress = issues.filter(
      (issue) => issue.status === "in_progress",
    ).length;
    const inReview = issues.filter(
      (issue) => issue.status === "in_review",
    ).length;
    const closed = issues.filter((issue) => issue.status === "closed").length;

    const urgent = issues.filter(
      (issue) =>
        issue.priority === "urgent" && issue.status !== "closed",
    ).length;

    const assigned = issues.filter((issue) => Boolean(getId(issue.assignee))).length;

    const uniqueMembers = new Set();

    for (const project of dashboard?.projects ?? []) {
      for (const member of project.members ?? []) {
        const id = getId(member);
        if (id) uniqueMembers.add(id);
      }
    }

    return {
      projects: dashboard?.projects?.length ?? 0,
      total: issues.length,
      open,
      inProgress,
      inReview,
      closed,
      urgent,
      assigned,
      unassigned: issues.length - assigned,
      uniqueMembers: uniqueMembers.size,
      completion:
        issues.length > 0 ? Math.round((closed / issues.length) * 100) : 0,
    };
  }, [dashboard]);

  const recentIssues = useMemo(() => {
    return [...(dashboard?.issues ?? [])]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 8);
  }, [dashboard]);

  if (dashboardQuery.isPending) {
    return <LoadingDashboard />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorDashboard
        error={dashboardQuery.error}
        retry={() => dashboardQuery.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
            <Sparkles size={14} />
            Workspace overview
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Track project delivery, monitor open work, and see what your team
            needs to focus on next.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-[#11141b] dark:text-slate-300 dark:hover:bg-white/5"
          >
            <RefreshCw
              size={15}
              className={dashboardQuery.isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            to="/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/15 transition hover:bg-violet-500"
          >
            <FolderKanban size={16} />
            View projects
          </Link>
        </div>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total projects"
          value={stats.projects}
          subtitle="Projects available in your workspace"
          icon={<BriefcaseBusiness size={21} />}
          tone="violet"
        />

        <MetricCard
          title="Total issues"
          value={stats.total}
          subtitle={`${stats.unassigned} currently unassigned`}
          icon={<ListTodo size={21} />}
          tone="blue"
        />

        <MetricCard
          title="In progress"
          value={stats.inProgress}
          subtitle={`${stats.inReview} awaiting review`}
          icon={<Clock3 size={21} />}
          tone="amber"
        />

        <MetricCard
          title="Completed"
          value={stats.closed}
          subtitle={`${stats.completion}% of all issues closed`}
          icon={<CheckCircle2 size={21} />}
          tone="emerald"
        />
      </section>

      {/* Progress and attention */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Panel
          title="Delivery progress"
          subtitle="Calculated from real issue statuses across your projects"
        >
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Overall completion
                </p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stats.completion}%
                </p>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {stats.closed} of {stats.total} issues closed
              </p>
            </div>

            <div
              className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]"
              role="progressbar"
              aria-label="Overall issue completion"
              aria-valuenow={stats.completion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-700"
                style={{ width: `${stats.completion}%` }}
              />
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  status: "open",
                  count: stats.open,
                },
                {
                  status: "in_progress",
                  count: stats.inProgress,
                },
                {
                  status: "in_review",
                  count: stats.inReview,
                },
                {
                  status: "closed",
                  count: stats.closed,
                },
              ].map((item) => {
                const config = STATUS_CONFIG[item.status];

                return (
                  <div
                    key={item.status}
                    className="rounded-xl border border-slate-100 p-3.5 dark:border-white/[0.07]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${config.color}`}
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {config.label}
                      </span>
                    </div>

                    <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel
          title="Needs attention"
          subtitle="Work that may need action"
        >
          <div className="divide-y divide-slate-100 dark:divide-white/[0.07]">
            <Link
              to="/issues"
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.03]"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
                <Zap size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Urgent open work
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Issues marked urgent that aren't closed
                </p>
              </div>

              <span className="text-xl font-bold text-rose-600 dark:text-rose-300">
                {stats.urgent}
              </span>
            </Link>

            <Link
              to="/issues"
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.03]"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                <Users size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Unassigned issues
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Work without an assigned member
                </p>
              </div>

              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.unassigned}
              </span>
            </Link>

            <Link
              to="/issues"
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.03]"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                <CircleDot size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Awaiting review
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Issues ready for the next step
                </p>
              </div>

              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.inReview}
              </span>
            </Link>
          </div>
        </Panel>
      </section>

      {/* Recent issues */}
      <Panel
        title="Recently updated issues"
        subtitle="Sorted by the latest issue update timestamp"
        action={
          <Link
            to="/issues"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-300"
          >
            All issues
            <ArrowRight size={15} />
          </Link>
        }
      >
        {recentIssues.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
              <ListTodo size={24} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
              No issues yet
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create an issue in a project to start tracking work.
            </p>

            <Link
              to="/issues"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Browse issues
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-white/[0.07] dark:bg-white/[0.02]">
                  {["Issue", "Project", "Status", "Priority", "Assignee", "Updated"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {recentIssues.map((issue) => (
                  <tr
                    key={getId(issue)}
                    className="transition hover:bg-violet-50/50 dark:hover:bg-violet-400/[0.04]"
                  >
                    <td className="max-w-72 px-5 py-4">
                      <Link
                        to={`/issues/${getId(issue)}`}
                        className="group flex items-start gap-3"
                      >
                        <div
                          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                            issue.type === "bug"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300"
                              : "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"
                          }`}
                        >
                          {issue.type === "bug" ? (
                            <Bug size={17} />
                          ) : (
                            <ListTodo size={17} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-violet-600 dark:text-slate-100 dark:group-hover:text-violet-300">
                            {issue.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {String(getId(issue)).slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </Link>
                    </td>

                    <td className="max-w-44 truncate px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {issue.projectName}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={issue.status} />
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-semibold capitalize ${
                          PRIORITY_CONFIG[issue.priority] ||
                          "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {issue.priority || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {issue.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white">
                            {getInitials(getDisplayName(issue.assignee))}
                          </div>

                          <span className="max-w-32 truncate text-xs text-slate-600 dark:text-slate-300">
                            {getDisplayName(issue.assignee)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(issue.updatedAt || issue.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Project overview */}
      <Panel
        title="Your projects"
        subtitle="Current project workload and completion"
        action={
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-300"
          >
            View projects
            <ArrowRight size={15} />
          </Link>
        }
      >
        {dashboard.projects.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FolderKanban
              size={28}
              className="mx-auto text-slate-400"
            />
            <p className="mt-3 font-semibold text-slate-800 dark:text-white">
              No projects yet
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a project to organize issues and team members.
            </p>
            <Link
              to="/projects"
              className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Create project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.projectResults.map(({ project, issues }) => {
              const closed = issues.filter(
                (issue) => issue.status === "closed",
              ).length;

              const progress =
                issues.length > 0
                  ? Math.round((closed / issues.length) * 100)
                  : 0;

              const memberCount = Array.isArray(project.members)
                ? project.members.length
                : 0;

              return (
                <article
                  key={getId(project)}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-200 hover:shadow-sm dark:border-white/[0.08] dark:hover:border-violet-400/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                      <FolderKanban size={19} />
                    </div>

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      {issues.length} issues
                    </span>
                  </div>

                  <h3 className="mt-4 truncate font-semibold text-slate-900 dark:text-white">
                    {project.name || "Untitled project"}
                  </h3>

                  <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    {project.description || "No project description provided."}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Completion</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {progress}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.07]">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Users size={14} />
                      {memberCount} members
                    </span>

                    <Link
                      to="/issues"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-300"
                    >
                      View issues
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <p className="pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Dashboard metrics are calculated from your projects and their issues.
      </p>
    </div>
  );
}
