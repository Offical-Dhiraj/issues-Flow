
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0d12] dark:text-white">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="min-w-0 flex-1">
          <Topbar onMenuClick={() => setMenuOpen(true)} />
          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-7 lg:p-9">
            <Outlet />
          </main>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-72">
            <Sidebar />
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-5 rounded-lg px-3 py-2 text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
