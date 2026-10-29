
import {
  Activity,
  Boxes,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  Settings2,
  Users,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: Boxes },
  { label: "Issues", to: "/issues", icon: Activity },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-[#111318] text-slate-300">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <div className="grid size-10 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-900/30">
          <Zap size={22} fill="currentColor" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            IssueFlow
          </h1>
          <p className="text-xs text-slate-500">Workspace</p>
        </div>
      </div>

      <button className="mx-3 mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left hover:bg-white/[0.08]">
        <div className="grid size-9 place-items-center rounded-lg bg-indigo-500/20 font-semibold text-indigo-300">
          IF
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            IssueFlow Team
          </p>
          <p className="text-xs text-slate-500">Free workspace</p>
        </div>
        <ChevronDown size={16} />
      </button>

      <div className="px-5 pb-2 pt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Workspace
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navigation.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-violet-500/15 font-semibold text-violet-300"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white">
          <Users size={18} />
          Team members
        </button>
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/[0.05] hover:text-white">
          <Settings2 size={18} />
          Settings
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/[0.05] hover:text-white">
          <CircleHelp size={18} />
          Help & support
        </button>
        <div className="flex items-center gap-3 rounded-xl p-3">
          <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white">
            DK
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">My account</p>
            <p className="truncate text-xs text-slate-500">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
