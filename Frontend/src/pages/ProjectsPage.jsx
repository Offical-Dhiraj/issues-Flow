
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  List,
  Plus,
  Search,
  Users,
  X,
  RefreshCw,
  FolderKanban,
} from "lucide-react";
import { useProjects, useCreateProject } from "../features/projects/useProjects";

const projectColors = [
  "bg-violet-500/10 text-violet-500",
  "bg-blue-500/10 text-blue-500",
  "bg-emerald-500/10 text-emerald-500",
  "bg-amber-500/10 text-amber-500",
];

function getProjectId(project) {
  return project?._id ?? project?.id ?? "";
}

function getProjectInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "PR";
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const {
    data: projects = [],
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useProjects();

  const createMutation = useCreateProject();

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) =>
      `${project.name ?? ""} ${project.description ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [projects, search]);

  const totalMembers = useMemo(() => {
    const memberIds = new Set();

    for (const project of projects) {
      for (const member of project.members ?? []) {
        const memberId =
          typeof member === "string"
            ? member
            : member?._id ?? member?.id;

        if (memberId) memberIds.add(String(memberId));
      }
    }

    return memberIds.size;
  }, [projects]);

  function openCreateDialog() {
    setFormError("");
    createMutation.reset();
    setShowCreate(true);
  }

  function closeCreateDialog() {
    if (createMutation.isPending) return;

    setShowCreate(false);
    setName("");
    setDescription("");
    setFormError("");
    createMutation.reset();
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setFormError("Please enter a project name.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: trimmedName,
        description: trimmedDescription,
      });

      setName("");
      setDescription("");
      setShowCreate(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
        <RefreshCw size={18} className="animate-spin" />
        Loading your projects...
      </div>
    );
  }

  if (isError) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-white p-8 dark:border-rose-500/20 dark:bg-[#13161e]">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
            <FolderKanban size={22} />
          </div>

          <h1 className="mt-4 text-xl font-bold">
            Couldn't load projects
          </h1>

          <p className="mt-2 break-words text-sm text-slate-500 dark:text-slate-400">
            {getErrorMessage(error)}
          </p>

          <button
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">
            Workspace / Projects
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Projects
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Organize work and keep your team moving forward.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh projects"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            <RefreshCw
              size={17}
              className={isFetching ? "animate-spin" : ""}
            />
          </button>

          <button
            onClick={openCreateDialog}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Plus size={18} />
            New project
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Your projects",
            value: projects.length,
            icon: Boxes,
          },
          {
            label: "Team members",
            value: totalMembers,
            icon: Users,
          },
          {
            label: "Project descriptions",
            value: projects.filter((project) =>
              Boolean(project.description?.trim())
            ).length,
            icon: CheckCircle2,
          },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#13161e]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon size={18} className="text-violet-500" />
            </div>

            <p className="mt-3 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-[#13161e]"
          />
        </div>

        <div className="flex rounded-xl border border-slate-200 p-1 dark:border-white/10">
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={`rounded-lg p-2 ${
              view === "grid"
                ? "bg-violet-500/10 text-violet-500"
                : "text-slate-500"
            }`}
          >
            <LayoutGrid size={18} />
          </button>

          <button
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={`rounded-lg p-2 ${
              view === "list"
                ? "bg-violet-500/10 text-violet-500"
                : "text-slate-500"
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </section>

      <section
        className={
          view === "grid"
            ? "grid gap-4 md:grid-cols-2 2xl:grid-cols-3"
            : "space-y-3"
        }
      >
        {filteredProjects.map((project, index) => {
          const projectId = getProjectId(project);
          const initials = getProjectInitials(project.name);
          const colorClass = projectColors[index % projectColors.length];

          return (
            <article
              key={projectId || `${project.name}-${index}`}
              className={`rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 hover:shadow-lg hover:shadow-violet-950/5 dark:border-white/10 dark:bg-[#13161e] dark:hover:border-violet-500/40 ${
                view === "list" ? "sm:flex sm:items-center sm:gap-6" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold ${colorClass}`}
                >
                  {initials}
                </div>

                <button
                  type="button"
                  aria-label={`Open ${project.name}`}
                  title="Project details coming soon"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-violet-500 dark:hover:bg-white/5"
                  onClick={() => {
                    // Project detail navigation will be added next.
                  }}
                >
                  <ArrowUpRight size={18} />
                </button>
              </div>

              <div className={view === "list" ? "mt-0 min-w-0 flex-1" : ""}>
                <p className="mt-5 text-xs font-medium uppercase tracking-wider text-slate-400">
                  {projectId ? `ID: ${String(projectId).slice(-8)}` : "Project"}
                </p>

                <h2 className="mt-1 break-words text-lg font-semibold">
                  {project.name}
                </h2>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {project.description || "No description provided."}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-white/10">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} />
                    {Array.isArray(project.members)
                      ? project.members.length
                      : 0}{" "}
                    members
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} />
                    {project.updatedAt
                      ? new Date(project.updatedAt).toLocaleDateString()
                      : "Recently created"}
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-white/15">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
              <FolderKanban size={22} />
            </div>

            <p className="mt-4 font-medium">
              {search.trim() ? "No matching projects" : "No projects yet"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {search.trim()
                ? "Try a different search term."
                : "Create your first project to get started."}
            </p>

            {!search.trim() && (
              <button
                onClick={openCreateDialog}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                <Plus size={17} />
                Create project
              </button>
            )}
          </div>
        )}
      </section>

      {showCreate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateDialog();
            }
          }}
        >
          <form
            onSubmit={handleCreateProject}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#171a23]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Create a project</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your project will be saved to the backend.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateDialog}
                disabled={createMutation.isPending}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium">
              Project name
              <input
                autoFocus
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Customer Portal"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-3 outline-none focus:border-violet-500 dark:border-white/10"
              />
            </label>

            <label className="mt-4 block text-sm font-medium">
              Description
              <textarea
                maxLength={1000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this project about?"
                rows={3}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-transparent px-3 py-3 outline-none focus:border-violet-500 dark:border-white/10"
              />
            </label>

            {formError && (
              <p role="alert" className="mt-3 break-words text-sm text-rose-500">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateDialog}
                disabled={createMutation.isPending}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium disabled:opacity-50 dark:border-white/10"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createMutation.isPending && (
                  <RefreshCw size={16} className="animate-spin" />
                )}
                {createMutation.isPending ? "Creating..." : "Create project"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
