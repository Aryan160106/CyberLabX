import { Link, Navigate } from "react-router-dom";
import { ArrowRight, BookOpen, Flag, Terminal, TrendingUp } from "lucide-react";
import { useAuth } from "../auth";
import { Logo } from "../components/Logo";

const steps = [
  { icon: BookOpen, title: "Learn", text: "Short, practical concept modules and a quick knowledge check." },
  { icon: Terminal, title: "Practice", text: "Launch your own isolated lab and attack a real vulnerable app." },
  { icon: Flag, title: "Get evaluated", text: "Solve missions, use hints, submit your flag, get scored." },
  { icon: TrendingUp, title: "Track progress", text: "Earn XP, watch your skills grow, see what to practice next." },
];

const labs = [
  {
    name: "OWASP Juice Shop",
    tag: "Web security",
    available: true,
    text: "A modern, intentionally insecure web app. Injection, broken auth, XSS and more.",
  },
  {
    name: "DVWA",
    tag: "Web security",
    available: false,
    text: "Classic vulnerable web app with adjustable difficulty levels.",
  },
  {
    name: "Metasploitable",
    tag: "Network / Linux",
    available: false,
    text: "A vulnerable Linux machine for scanning, enumeration and exploitation.",
  },
];

const terminalLines = [
  { text: "$ cyberlabx launch juice-shop", cls: "text-ink" },
  { text: "creating isolated namespace ........ ok", cls: "text-dim" },
  { text: "deploying lab pod .................. ok", cls: "text-dim" },
  { text: "waiting for readiness probe ........ ok", cls: "text-dim" },
  { text: "lab ready. only you can reach it.", cls: "text-ok" },
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/login" className="text-dim hover:text-ink">
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:opacity-90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="border-b border-line"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          backgroundPosition: "center top",
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-10 bg-bg/80 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-cyan">
              Hands-on cybersecurity training
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Learn it. Break it. <span className="text-brand">Prove it.</span>
            </h1>
            <p className="mt-4 max-w-lg text-dim">
              CyberLabX gives you a disposable, isolated lab for every challenge. Learn the concept, attack a real
              vulnerable app, submit your flag and get scored.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Start practicing <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/login"
                className="rounded-md border border-line px-4 py-2.5 text-sm text-ink hover:border-brand"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Terminal panel */}
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2">
              <span className="size-2.5 rounded-full bg-danger/70" />
              <span className="size-2.5 rounded-full bg-warn/70" />
              <span className="size-2.5 rounded-full bg-ok/70" />
              <span className="ml-2 font-mono text-xs text-dim">lab-session</span>
            </div>
            <div className="space-y-1.5 p-4 font-mono text-xs sm:text-sm">
              {terminalLines.map((l) => (
                <p key={l.text} className={l.cls}>
                  {l.text}
                </p>
              ))}
              <p className="text-ok">
                $ <span className="animate-pulse">_</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-1 text-sm text-dim">One loop, repeated until the skill sticks.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-lg border border-line bg-card p-5">
              <div className="flex items-center justify-between">
                <s.icon className="size-5 text-brand" />
                <span className="font-mono text-xs text-dim">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-dim">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Labs */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Labs</h2>
          <p className="mt-1 text-sm text-dim">Every lab runs in its own isolated environment, created just for you.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {labs.map((lab) => (
              <div key={lab.name} className="rounded-lg border border-line bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cyan">{lab.tag}</span>
                  <span
                    className={
                      "inline-flex items-center gap-1.5 font-mono text-xs " +
                      (lab.available ? "text-ok" : "text-dim")
                    }
                  >
                    <span className={"size-1.5 rounded-full " + (lab.available ? "bg-ok" : "bg-dim")} />
                    {lab.available ? "Available" : "Coming soon"}
                  </span>
                </div>
                <h3 className="mt-3 font-medium">{lab.name}</h3>
                <p className="mt-1 text-sm text-dim">{lab.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Ready for your first lab?</h2>
        <p className="mt-2 text-sm text-dim">Create an account and launch Juice Shop in a few clicks.</p>
        <Link
          to="/signup"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Create free account <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="border-t border-line py-6 text-center font-mono text-xs text-dim">
        CyberLabX - built for learning. Labs run in isolated, disposable environments.
      </footer>
    </div>
  );
}


