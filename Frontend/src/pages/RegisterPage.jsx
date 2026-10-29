
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  Zap,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";

export default function RegisterPage() {
  const { user, isLoading, register } = useAuth();
  const navigate = useNavigate();

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

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create your account. Please check your details."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0c10] px-4 py-8 text-white">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-violet-700/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#111319] shadow-2xl shadow-black/30 lg:grid-cols-2">
        <section className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-violet-950/70 via-[#151322] to-[#111319] p-10 lg:flex">
          <Brand />

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
              Start building together
            </p>
            <h1 className="max-w-sm text-4xl font-bold leading-tight tracking-tight">
              Bring every project into focus.
            </h1>
            <p className="mt-5 max-w-sm leading-7 text-slate-400">
              Create your account to organize projects, track issues and
              collaborate with your team in one place.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Keep projects and tasks organized",
                "Track issues from start to finish",
                "Stay focused on what matters",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-500/15 text-violet-300">
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            A clearer way to move work forward.
          </p>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="mb-7">
            <p className="text-sm font-semibold text-violet-300">
              GET STARTED
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Create your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Set up your account and start organizing your work.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-slate-300">
                Full name
              </label>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="register-email"
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
              <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
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

            <div>
              <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-medium text-slate-300">
                Confirm password
              </label>
              <input
                id="register-confirm-password"
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
              {submitting ? "Creating account..." : "Create account"}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
              Sign in
            </Link>
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
