
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FolderKanban,
  LockKeyhole,
  Mail,
  Zap,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0c10] text-slate-400">
        Checking your session...
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to sign in. Check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0c10] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-violet-700/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#111319] shadow-2xl shadow-black/30 lg:grid-cols-2">
        <section className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-violet-950/70 via-[#151322] to-[#111319] p-10 lg:flex">
          <Brand />

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
              Welcome back
            </p>
            <h1 className="max-w-sm text-4xl font-bold leading-tight tracking-tight">
              Great work starts with a clear workspace.
            </h1>
            <p className="mt-5 max-w-sm leading-7 text-slate-400">
              Pick up where your team left off. Keep projects organized and
              move every issue forward.
            </p>

            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                <FolderKanban size={22} />
              </div>
              <div>
                <p className="font-medium">One workspace. Clear progress.</p>
                <p className="mt-1 text-sm text-slate-400">
                  Projects, issues and teamwork.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Your team's work, moving forward.
          </p>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-9 lg:hidden">
            <Brand />
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-violet-300">
              WELCOME BACK
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Sign in to IssueFlow
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enter your account details to continue to your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-violet-300 hover:text-violet-200">
              Create an account
            </Link>
          </p>

          <p className="mt-8 text-center text-xs text-slate-500">
            Protected access to your IssueFlow workspace.
          </p>
        </section>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/25">
        <Zap size={25} fill="white" />
      </div>
      <div>
        <p className="text-xl font-bold tracking-tight">IssueFlow</p>
        <p className="text-sm text-slate-400">Project workspace</p>
      </div>
    </div>
  );
}
