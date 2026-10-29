
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

export default function Topbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#111318]/90 sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
          Workspace <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            Overview
          </span>
        </div>
        <span className="font-semibold text-slate-900 dark:text-white sm:hidden">
          IssueFlow
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          aria-label="Search"
          className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5 sm:px-3"
        >
          <Search size={17} />
          <span className="hidden text-sm sm:inline">Search issues...</span>
          <kbd className="hidden rounded border border-slate-200 px-1.5 text-xs dark:border-white/10 md:inline">
            Ctrl K
          </kbd>
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          aria-label="Notifications"
          className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-violet-500" />
        </button>
      </div>
    </header>
  );
}
