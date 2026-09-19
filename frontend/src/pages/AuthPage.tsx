import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Logo } from "../components/Logo";

const inputClass =
  "mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
  const isSignup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isSignup) await signup(email, password, name);
      else await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo large />
        </div>

        <form onSubmit={onSubmit} className="rounded-lg border border-line bg-card p-6 space-y-4">
          <div>
            <h1 className="text-lg font-semibold">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-dim">
              {isSignup ? "Start practicing real cybersecurity skills." : "Log in to continue your training."}
            </p>
          </div>

          {isSignup && (
            <label className="block text-sm">
              Display name
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                autoComplete="nickname"
              />
            </label>
          )}

          <label className="block text-sm">
            Email
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="block text-sm">
            Password
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
            {isSignup && <span className="mt-1 block text-xs text-dim">At least 8 characters.</span>}
          </label>

          {error && (
            <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-brand py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-dim">
          {isSignup ? "Already have an account?" : "New to CyberLabX?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"} className="text-brand hover:underline">
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}