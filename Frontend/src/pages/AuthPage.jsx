
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FolderKanban,
  LockKeyhole,
  Mail,
  UserRound,
  Zap,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const { user, isLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      if (isRegister) {
        await register({ name: name.trim(), email: email.trim(), password });
      } else {
        await login({ email: email.trim(), password });
      }

      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0c10] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-violet-700/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#111319] shadow-2xl shadow-black/30 lg:grid-cols-2">
        <section className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-violet-950/70 via-[#151322] to-[#111319] p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/25">
                <Zap size={26} fill="white" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">IssueFlow</p>
                <p className="text-sm text-slate-400">Project workspace</p>
              </div>
            </div>

            <div className="mt-24">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
                Work in sync
              </p>
              <h1 className="max-w-sm text-4xl font-bold leading-tight tracking-tight">
                Your team's work, moving forward.
              </h1>
              <p className="mt-5 max-w-sm leading-7 text-slate-400">
                Organize projects, manage issues, and keep every task moving
                with one focused workspace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <FolderKanban className="mb-3 text-violet-300" size={21} />
              <p className="font-medium">Projects</p>
              <p className="mt-1 text-xs text-slate-400">Keep work organized</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <LockKeyhole className="mb-3 text-violet-300" size={21} />
              <p className="font-medium">Secure access</p>
              <p className="mt-1 text-xs text-slate-400">Private team workspace</p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600">
              <Zap size={24} fill="white" />
            </div>
            <span className="text-xl font-bold">IssueFlow</span>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium text-violet-300">
              {isRegister ? "GET STARTED" : "WELCOME BACK"}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              {isRegister ? "Create your account" : "Sign in to IssueFlow"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {isRegister
                ? "Create your workspace account and get your projects organized."
                : "Enter your details to continue to your workspace."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
                  Full name
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="email"
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
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            {isRegister ? "Already have an account?" : "New to IssueFlow?"}{" "}
            <Link
              to={isRegister ? "/login" : "/register"}
              className="font-semibold text-violet-300 transition hover:text-violet-200"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>

          <p className="mt-8 text-center text-xs leading-5 text-slate-500">
            By continuing, you agree to use your workspace responsibly.
          </p>
        </section>
      </div>
    </main>
  );
}
