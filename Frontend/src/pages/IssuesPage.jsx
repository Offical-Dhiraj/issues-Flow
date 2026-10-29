import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bug,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Filter,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { useProjects } from "../features/projects/useProjects";
import {
  useCreateIssue,
  useIssues,
} from "../features/issues/useIssues";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TYPE_OPTIONS = [
  { value: "task", label: "Task" },
  { value: "bug", label: "Bug" },
];

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#11141c] dark:text-slate-100 dark:placeholder:text-slate-500";

const labelClass =
  "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

const statusConfig = {
  open: {
    label: "Open",
    classes:
      "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  in_progress: {
    label: "In progress",
    classes:
      "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  in_review: {
    label: "In review",
    classes:
      "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  closed: {
    label: "Closed",
    classes:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

const priorityConfig = {
  low: { label: "Low", color: "text-slate-500", icon: ArrowDown },
  medium: {
    label: "Medium",
    color: "text-sky-600 dark:text-sky-300",
    icon: ArrowUpRight,
  },
  high: {
    label: "High",
    color: "text-orange-600 dark:text-orange-300",
    icon: ArrowUp,
  },
  urgent: {
    label: "Urgent",
    color: "text-rose-600 dark:text-rose-300",
    icon: AlertCircle,
  },
};

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id ?? value.id ?? "";
}

function getLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? value ?? "—";
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors
      .map((item) => {
        const field =
          item.field ||
          (Array.isArray(item.path) ? item.path.join(".") : "");

        return field
          ? `${field}: ${item.message}`
          : item.message || "Invalid value";
      })
      .filter(Boolean)
      .join(" · ");
  }

  return (
    data?.message ||
    data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
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

export default function IssuesPage() {
  const navigate = useNavigate();

  const {
    data: projectData,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsErrorDetails,
    refetch: refetchProjects,
  } = useProjects();

  // Supports the array returned by useProjects and common API wrappers.
  const projects = Array.isArray(projectData)
    ? projectData
    : Array.isArray(projectData?.data)
      ? projectData.data
      : Array.isArray(projectData?.projects)
        ? projectData.projects
        : [];

  const createMutation = useCreateIssue();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [type, setType] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "task",
    priority: "medium",
  });

  const activeProjectId = projects.some(
    (project) => getId(project) === selectedProjectId,
  )
    ? selectedProjectId
    : getId(projects[0]);

  const activeProject = projects.find(
    (project) => getId(project) === activeProjectId,
  );

  const {
    data: issueData,
    isLoading: issuesLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useIssues(
    activeProjectId ? { projectId: activeProjectId } : {},
  );

  const issues = Array.isArray(issueData)
    ? issueData
    : Array.isArray(issueData?.data)
      ? issueData.data
      : Array.isArray(issueData?.issues)
        ? issueData.issues
        : [];

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesSearch =
        !query ||
        issue.title?.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query);

      const matchesStatus = status === "all" || issue.status === status;
      const matchesPriority =
        priority === "all" || issue.priority === priority;
      const matchesType = type === "all" || issue.type === type;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesType
      );
    });
  }, [issues, search, status, priority, type]);

  const stats = useMemo(
    () => ({
      total: issues.length,
      open: issues.filter((issue) => issue.status === "open").length,
      inProgress: issues.filter(
        (issue) => issue.status === "in_progress",
      ).length,
      closed: issues.filter((issue) => issue.status === "closed").length,
    }),
    [issues],
  );

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setFormError("");
    setShowCreate(true);
  }

  function closeCreateModal() {
    if (createMutation.isPending) return;

    setShowCreate(false);
    setFormError("");
  }

  async function handleCreate(event) {
    event.preventDefault();
    setFormError("");

    if (!activeProjectId) {
      setFormError("Create or select a project before creating an issue.");
      return;
    }

    if (!form.title.trim()) {
      setFormError("Please enter an issue title.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        // The backend createIssue service expects `project`.
        project: activeProjectId,
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        priority: form.priority,
      });

      setForm({
        title: "",
        description: "",
        type: "task",
        priority: "medium",
      });

      setShowCreate(false);
      setFormError("");

      await refetch();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  async function handleRefresh() {
    await Promise.all([refetch(), refetchProjects()]);
  }

  const hasFilters =
    Boolean(search.trim()) ||
    status !== "all" ||
    priority !== "all" ||
    type !== "all";

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setType("all");
  }

  function openIssue(issue) {
    const issueId = getId(issue);
    if (!issueId) return;

    navigate(`/issues/${issueId}`);
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Workspace
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Issues
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Issues
            </h1>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {stats.total} total
            </span>
          </div>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Plan your work, assign responsibilities, and track every issue
            through completion.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={projectsLoading || !projects.length}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Create issue
        </button>
      </header>

      {/* Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total issues"
          value={stats.total}
          icon={<ListTodo size={20} />}
          accent="violet"
          helper="Issues in the selected project"
        />

        <StatCard
          label="Open"
          value={stats.open}
          icon={<CircleDot size={20} />}
          accent="blue"
          helper="Waiting to be started"
        />

        <StatCard
          label="In progress"
          value={stats.inProgress}
          icon={<Clock3 size={20} />}
          accent="amber"
          helper="Currently being worked on"
        />

        <StatCard
          label="Completed"
          value={stats.closed}
          icon={<Check size={20} />}
          accent="emerald"
          helper="Successfully closed"
        />
      </section>

      {/* Issues workspace */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#11141b]">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 dark:border-white/[0.07] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              All issues
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeProject?.name || "Select a project"} · Browse and manage
              your team's work.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {filteredIssues.length} results
            </span>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching || projectsLoading}
              title="Refresh issues"
              aria-label="Refresh issues"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <RefreshCw
                size={17}
                className={isFetching ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="space-y-4 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-white/[0.07] dark:bg-white/[0.015] sm:p-5">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(135px,auto))]">
            <div className="relative min-w-0">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search issues..."
                aria-label="Search issues"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#11141c] dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <FilterSelect
              label="Project"
              value={activeProjectId}
              onChange={setSelectedProjectId}
              options={projects.map((project) => ({
                value: getId(project),
                label: project.name,
              }))}
              disabled={projectsLoading || !projects.length}
            />

            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All statuses" },
                ...STATUS_OPTIONS,
              ]}
            />

            <FilterSelect
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={[
                { value: "all", label: "All priorities" },
                ...PRIORITY_OPTIONS,
              ]}
            />

            <FilterSelect
              label="Type"
              value={type}
              onChange={setType}
              options={[
                { value: "all", label: "All types" },
                ...TYPE_OPTIONS,
              ]}
            />
          </div>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <SlidersHorizontal size={14} />
                Active filters
              </span>

              {search.trim() && (
                <FilterChip
                  label={`Search: ${search.trim()}`}
                  onRemove={() => setSearch("")}
                />
              )}

              {status !== "all" && (
                <FilterChip
                  label={getLabel(STATUS_OPTIONS, status)}
                  onRemove={() => setStatus("all")}
                />
              )}

              {priority !== "all" && (
                <FilterChip
                  label={`${getLabel(PRIORITY_OPTIONS, priority)} priority`}
                  onRemove={() => setPriority("all")}
                />
              )}

              {type !== "all" && (
                <FilterChip
                  label={getLabel(TYPE_OPTIONS, type)}
                  onRemove={() => setType("all")}
                />
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Loading and error states */}
        {projectsLoading || issuesLoading ? (
          <LoadingState />
        ) : projectsError ? (
          <ErrorState
            message={getErrorMessage(projectsErrorDetails)}
            onRetry={refetchProjects}
          />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={24} />}
            title="Create your first project"
            message="Issues belong to projects. Create a project first, then start assigning work to your team."
            action={
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Go to projects
              </button>
            }
          />
        ) : filteredIssues.length === 0 ? (
          <EmptyState
            icon={
              hasFilters ? <Filter size={24} /> : <ListTodo size={24} />
            }
            title={hasFilters ? "No matching issues" : "No issues yet"}
            message={
              hasFilters
                ? "Try changing your search or removing some filters."
                : "Create your first issue to give your project a clear next step."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <Plus size={16} />
                  Create first issue
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-white/[0.07] dark:bg-white/[0.02]">
                  {["Issue", "Status", "Priority", "Type", "Assignee", "Created"].map(
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
                {filteredIssues.map((issue) => (
                  <tr
                    key={getId(issue)}
                    onClick={() => openIssue(issue)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openIssue(issue);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open issue ${issue.title}`}
                    className="cursor-pointer transition hover:bg-violet-50/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500 dark:hover:bg-violet-400/[0.06]"
                  >
                    <td className="max-w-[360px] px-5 py-4">
                      <div className="flex items-start gap-3">
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
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {issue.title}
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {issue.description || "No description provided"}
                          </p>

                          {Array.isArray(issue.labels) &&
                            issue.labels.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {issue.labels.slice(0, 3).map((item) => (
                                  <span
                                    key={item}
                                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={issue.status} />
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge priority={issue.priority} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:text-slate-300">
                        {getLabel(TYPE_OPTIONS, issue.type)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {issue.assignee ? (
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white">
                            {getInitials(
                              issue.assignee.name ||
                                issue.assignee.email ||
                                "User",
                            )}
                          </div>

                          <span className="max-w-32 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                            {issue.assignee.name ||
                              issue.assignee.email ||
                              "Assigned"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(issue.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isError &&
          !projectsError &&
          !issuesLoading &&
          !projectsLoading &&
          filteredIssues.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 dark:border-white/[0.07] dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredIssues.length} of {issues.length} issues
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {activeProject?.name || "Selected project"}
              </span>
            </div>
          )}
      </section>

      {/* Create issue modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !createMutation.isPending
            ) {
              closeCreateModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-issue-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151821]"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 dark:border-white/[0.08] sm:px-7">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                  <Plus size={21} />
                </div>

                <div>
                  <h2
                    id="create-issue-title"
                    className="text-lg font-bold text-slate-900 dark:text-white"
                  >
                    Create an issue
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Describe the work you want your team to complete.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={createMutation.isPending}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-5 sm:p-7">
              <div>
                <label htmlFor="issue-project" className={labelClass}>
                  Project <span className="text-rose-500">*</span>
                </label>

                <select
                  id="issue-project"
                  value={activeProjectId}
                  onChange={(event) =>
                    setSelectedProjectId(event.target.value)
                  }
                  required
                  className={fieldClass}
                >
                  {projects.map((project) => (
                    <option key={getId(project)} value={getId(project)}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="issue-title" className={labelClass}>
                  Issue title <span className="text-rose-500">*</span>
                </label>

                <input
                  id="issue-title"
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  required
                  maxLength={200}
                  autoFocus
                  placeholder="What needs to be done?"
                  className={fieldClass}
                />

                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {form.title.length}/200
                </p>
              </div>

              <div>
                <label htmlFor="issue-description" className={labelClass}>
                  Description{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  id="issue-description"
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  rows={4}
                  maxLength={10000}
                  placeholder="Add context, expected behavior, or acceptance criteria..."
                  className={`${fieldClass} resize-y leading-6`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="issue-type" className={labelClass}>
                    Issue type
                  </label>

                  <select
                    id="issue-type"
                    name="type"
                    value={form.type}
                    onChange={updateForm}
                    className={fieldClass}
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="issue-priority" className={labelClass}>
                    Priority
                  </label>

                  <select
                    id="issue-priority"
                    name="priority"
                    value={form.priority}
                    onChange={updateForm}
                    className={fieldClass}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span className="break-words">{formError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-white/[0.08] sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={createMutation.isPending}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createMutation.isPending || !projects.length}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/15 transition hover:bg-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Creating issue...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create issue
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent, helper }) {
  const accentStyles = {
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/[0.08] dark:bg-[#11141b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`grid h-11 w-11 place-items-center rounded-xl ${accentStyles[accent]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        {helper}
      </p>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>

      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-9 text-sm font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50 dark:border-white/10 dark:bg-[#11141c] dark:text-slate-300 dark:hover:border-white/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </label>
  );
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status || "Unknown",
    classes:
      "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || {
    label: priority || "Unknown",
    color: "text-slate-500 dark:text-slate-400",
    icon: ArrowUpRight,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${config.color}`}
    >
      <Icon size={15} />
      {config.label}
    </span>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
      <span className="truncate">{label}</span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="shrink-0 rounded hover:bg-violet-100 dark:hover:bg-violet-400/20"
      >
        <X size={13} />
      </button>
    </span>
  );
}

function LoadingState() {
  return (
    <div className="grid min-h-72 place-items-center px-6 py-12">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <RefreshCw size={18} className="animate-spin text-violet-500" />
        Loading your issues...
      </div>
    </div>
  );
}

function EmptyState({ icon, title, message, action }) {
  return (
    <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
          {icon}
        </div>

        <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {message}
        </p>

        {action}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
          <AlertCircle size={25} />
        </div>

        <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
          Couldn't load issues
        </h3>

        <p className="mt-2 break-words text-sm leading-6 text-slate-500 dark:text-slate-400">
          {message}
        </p>

        <button
          type="button"
          onClick={() => onRetry()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    </div>
  );
}