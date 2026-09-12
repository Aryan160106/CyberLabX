import { useState, useEffect, useRef } from "react";
import { fetchLabs, deployLab, deleteLab, type BackendLab } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────
type LabStatus = "running" | "pending" | "stopped";
type Screen = "login" | "dashboard" | "detail" | "monitoring";

interface Lab {
  id: string;
  student: string;
  appType: string;
  appIcon: string;
  status: LabStatus;
  cpu: number;
  memory: number;
  timeRemaining: number; // minutes
  totalTime: number; // minutes
  namespace: string;
  url: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// NOTE: ids here must exactly match the keys of SUPPORTED_LABS in the FastAPI backend (main.py)
const LAB_TYPES = [
  {
    id: "juice-shop",
    name: "Juice Shop",
    icon: "🧃",
    desc: "OWASP Top 10 training",
    image: "bkimminich/juice-shop:v17.2.0",
    tag: "Web App",
    color: "#FF9500",
  },
  {
    id: "dvwa",
    name: "DVWA",
    icon: "🕸️",
    desc: "Damn Vulnerable Web App",
    image: "vulnerables/web-dvwa:latest",
    tag: "PHP/MySQL",
    color: "#FF4D6D",
  },
  {
    id: "metasploitable",
    name: "Metasploitable",
    icon: "💀",
    desc: "Network pentesting target",
    image: "tleemcjr/metasploitable2:latest",
    tag: "Network",
    color: "#8B5CF6",
  },
];

// Turn a raw namespace-based backend lab into the richer Lab shape the UI expects.
// Real fields (namespace, status, url, appType) come from the cluster; CPU/memory/TTL
// are simulated since Prometheus isn't wired in yet (Sprint 4 groundwork exists, but this
// dashboard doesn't pull live metrics).
function mapBackendLab(bl: BackendLab): Lab {
  const lt = LAB_TYPES.find(l => l.id === bl.lab_type as any);
  const isRunning = bl.pod_statuses.some(s => s === "Running");
  const isPending = bl.pod_statuses.some(s => s === "Pending");
  const status: LabStatus = isRunning ? "running" : isPending ? "pending" : "stopped";

  return {
    id: bl.namespace,
    student: bl.namespace.replace(/^lab-/, "").replace(/^student-/, "student-"),
    appType: lt ? lt.name : bl.lab_type === "student" ? "Legacy Lab" : "Unknown",
    appIcon: lt ? lt.icon : "❓",
    status,
    cpu: isRunning ? Math.floor(Math.random() * 40) + 10 : 0,
    memory: isRunning ? Math.floor(Math.random() * 300) + 200 : 0,
    timeRemaining: isRunning ? 45 : 0,
    totalTime: 60,
    namespace: bl.namespace,
    url: bl.lab_url || "",
  };
}

const LOG_LINES = [
  "[2026-08-21 09:14:32] INFO  Pod lab-alice-juiceshop-7d9f4b running",
  "[2026-08-21 09:14:33] INFO  Ingress route active",
  "[2026-08-21 09:14:34] WARN  CPU spike detected: 89% → throttling",
  "[2026-08-21 09:14:35] INFO  Health check /rest/admin/application-configuration OK",
  "[2026-08-21 09:14:36] INFO  NetworkPolicy applied: egress blocked",
  "[2026-08-21 09:14:37] INFO  Request GET /rest/products/search?q=<script> 200",
  "[2026-08-21 09:14:38] WARN  XSS payload detected in request params",
  "[2026-08-21 09:14:39] INFO  Auto-cleanup TTL: 42m remaining",
  "[2026-08-21 09:14:40] INFO  Prometheus scrape /metrics 200 OK",
  "[2026-08-21 09:14:41] INFO  Student challenge solved: SQL Injection (1/5)",
  "[2026-08-21 09:14:42] DEBUG Namespace resource quota: 0.34/1.0 CPU",
  "[2026-08-21 09:14:43] INFO  Ingress traffic 1.2 KB/s",
  "[2026-08-21 09:14:44] INFO  PodSecurityPolicy enforced: restricted",
  "[2026-08-21 09:14:45] DEBUG Memory usage: 512Mi / 1Gi",
  "[2026-08-21 09:14:46] INFO  Challenge unlocked: XSS (2/5)",
  "[2026-08-21 09:14:47] INFO  Health probe liveness OK",
  "[2026-08-21 09:14:48] WARN  Brute force attempt detected from 10.0.0.42",
  "[2026-08-21 09:14:49] INFO  Rate limit applied: 429 Too Many Requests",
  "[2026-08-21 09:14:50] INFO  Grafana dashboard scraped 23 metrics",
  "[2026-08-21 09:14:51] INFO  Helm release lab-alice-juiceshop STATUS: deployed",
];

const PIPELINE_STEPS = [
  { id: 1, label: "Containerize", desc: "Docker images hardened", done: true },
  { id: 2, label: "Orchestrate", desc: "K8s namespace isolation", done: true },
  { id: 3, label: "Isolate (Helm)", desc: "Per-student Helm releases", done: true },
  { id: 4, label: "CI/CD", desc: "GitHub Actions pipeline", done: true },
  { id: 5, label: "Monitor", desc: "Prometheus + Grafana", done: false },
  { id: 6, label: "Auto-Cleanup", desc: "TTL-based teardown job", done: false },
  { id: 7, label: "Dashboard", desc: "CyberLabX UI (this!)", done: false },
];

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#00FF9C" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const w = 80, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" fill="none" opacity="0.9" />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`${color}18`}
        stroke="none"
      />
    </svg>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({
  pct,
  size = 52,
  stroke = 3,
  color = "#00FF9C",
  label,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1C2A3A" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {label && (
        <span
          style={{
            position: "absolute",
            fontSize: "9px",
            fontFamily: "JetBrains Mono, monospace",
            color: color,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LabStatus }) {
  const cfg = {
    running: { color: "#00FF9C", label: "RUNNING", pulse: "pulse-dot-green" },
    pending: { color: "#FFD166", label: "PENDING", pulse: "pulse-dot-yellow" },
    stopped: { color: "#FF4D6D", label: "STOPPED", pulse: "pulse-dot-red" },
  }[status];
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cfg.pulse}
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.65rem",
          fontWeight: 600,
          color: cfg.color,
          letterSpacing: "0.1em",
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ─── Network SVG Illustration ─────────────────────────────────────────────────
function NetworkIllustration() {
  const nodes = [
    { x: 120, y: 80 }, { x: 280, y: 40 }, { x: 420, y: 100 },
    { x: 60, y: 180 }, { x: 200, y: 160 }, { x: 360, y: 180 },
    { x: 480, y: 140 }, { x: 150, y: 260 }, { x: 320, y: 240 },
    { x: 440, y: 260 },
  ];
  const edges = [
    [0,1],[1,2],[0,4],[1,4],[2,5],[3,4],[4,5],[2,6],[5,6],[3,7],[4,7],[5,8],[6,9],[7,8],[8,9],
  ];
  return (
    <svg width="540" height="300" viewBox="0 0 540 300" fill="none" opacity="0.7">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="#00FF9C"
          strokeWidth="0.8"
          strokeDasharray="4 4"
          opacity="0.3"
          style={{ animation: `dash-flow ${1.5 + i * 0.1}s linear infinite` }}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i} style={{ animation: `node-float ${3 + i * 0.3}s ease-in-out infinite` }}>
          <circle cx={n.x} cy={n.y} r={i < 3 ? 10 : 6} fill="#0A0E14" stroke="#00FF9C" strokeWidth="1.5" opacity="0.9" />
          <circle cx={n.x} cy={n.y} r={i < 3 ? 3 : 2} fill="#00FF9C" opacity="0.8" />
          {i < 3 && (
            <circle cx={n.x} cy={n.y} r="16" fill="none" stroke="#00FF9C" strokeWidth="0.5" opacity="0.3"
              style={{ animation: `pulse-green ${2 + i * 0.5}s ease-in-out infinite` }} />
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Mini Line Chart ──────────────────────────────────────────────────────────
function MiniLineChart({
  data,
  color,
  width = 200,
  height = 60,
  label,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  label: string;
}) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 8) - 4}`).join(" ");
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", letterSpacing: "0.08em" }}>
          {label}
        </span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: color }}>
          {data[data.length - 1]}%
        </span>
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        <polyline points={pts} stroke={color} strokeWidth="1.5" fill="none" />
        <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`${color}15`} stroke="none" />
        <circle
          cx={(((data.length - 1) / (data.length - 1)) * width)}
          cy={height - (data[data.length - 1] / max) * (height - 8) - 4}
          r="3" fill={color}
        />
      </svg>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@cyberlabx.io");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  return (
    <div className="circuit-bg min-h-screen flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Scan line effect */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #00FF9C40, transparent)",
          animation: "scan-line 8s linear infinite",
          pointerEvents: "none", zIndex: 1,
        }}
      />

      <div className="flex flex-1 items-center justify-center px-4" style={{ overflowY: "auto", padding: "2vh 16px" }}>
        <div className="w-full" style={{ maxWidth: 420 }}>
          {/* Logo */}
          <div className="text-center mb-6 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                style={{
                  width: 44, height: 44, border: "2px solid #00FF9C",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,255,156,0.05)",
                  boxShadow: "0 0 20px rgba(0,255,156,0.2)",
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                <span style={{ fontSize: "20px" }}>⬡</span>
              </div>
              <div>
                <h1 style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "#00FF9C",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  textShadow: "0 0 20px rgba(0,255,156,0.4)",
                }}>
                  CYBER<span style={{ color: "#38BDF8" }}>LAB</span>X
                </h1>
                <p style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.6rem",
                  color: "#4A6478",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                }}>
                  CYBER RANGE PLATFORM
                </p>
              </div>
            </div>
            <p style={{ color: "#8BA5BB", fontSize: "0.9rem" }}>
              Isolated cyber ranges, on demand.
            </p>
          </div>

          {/* Login card */}
          <div
            className="animate-fade-in-up"
            style={{
              background: "#111820",
              border: "1px solid #1C2A3A",
              borderRadius: 8,
              padding: "24px",
              boxShadow: "0 0 40px rgba(0,255,156,0.05), 0 20px 60px rgba(0,0,0,0.5)",
              animationDelay: "0.1s",
            }}
          >
            <div
              style={{
                height: 2,
                background: "linear-gradient(90deg, #00FF9C, #38BDF8)",
                marginBottom: 18,
                borderRadius: 1,
              }}
            />

            <div className="mb-4">
              <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#4A6478", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                IDENTITY
              </label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: "100%", background: "#0D1117", border: "1px solid #1C2A3A",
                  borderRadius: 4, padding: "10px 14px",
                  fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem",
                  color: "#E8F4F8", outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#00FF9C"}
                onBlur={e => e.target.style.borderColor = "#1C2A3A"}
              />
            </div>

            <div className="mb-6">
              <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#4A6478", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                AUTH KEY
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: "100%", background: "#0D1117", border: "1px solid #1C2A3A",
                  borderRadius: 4, padding: "10px 14px",
                  fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem",
                  color: "#E8F4F8", outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#00FF9C"}
                onBlur={e => e.target.style.borderColor = "#1C2A3A"}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-accent w-full"
              style={{
                padding: "12px",
                borderRadius: 4,
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>AUTHENTICATING</span>
                  <span style={{ animation: "blink-cursor 0.8s step-end infinite" }}>_</span>
                </>
              ) : (
                "INITIALIZE SESSION →"
              )}
            </button>

            <p style={{ textAlign: "center", marginTop: 16, fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478" }}>
              SSO / LDAP / GitHub OAuth supported
            </p>
          </div>

          {/* Network illustration */}
          <div className="flex justify-center mt-4 opacity-30" style={{ transform: "scale(0.45)", marginBottom: "-40px" }}>
            <NetworkIllustration />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Top Nav ──────────────────────────────────────────────────────────────────
function TopNav({
  screen,
  onNavigate,
  selectedLab,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  selectedLab?: Lab | null;
}) {
  return (
    <div
      style={{
        background: "#0D1117",
        borderBottom: "1px solid #1C2A3A",
        padding: "0 24px",
        height: 52,
        display: "flex",
        alignItems: "center",
        gap: 20,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <button
        onClick={() => onNavigate("dashboard")}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}
      >
        <div style={{
          width: 28, height: 28, border: "1.5px solid #00FF9C",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,255,156,0.05)",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}>
          <span style={{ fontSize: "12px" }}>⬡</span>
        </div>
        <span style={{
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: 700, fontSize: "0.85rem",
          color: "#00FF9C", letterSpacing: "0.04em",
          textShadow: "0 0 12px rgba(0,255,156,0.3)",
        }}>
          CYBER<span style={{ color: "#38BDF8" }}>LAB</span>X
        </span>
      </button>

      {/* Nav items */}
      <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
        {[
          { id: "dashboard", label: "DASHBOARD" },
          { id: "monitoring", label: "MONITORING" },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Screen)}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              padding: "5px 12px",
              background: "none",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              color: screen === item.id ? "#00FF9C" : "#4A6478",
              borderBottom: screen === item.id ? "2px solid #00FF9C" : "2px solid transparent",
              transition: "all 0.2s",
            }}
          >
            {item.label}
          </button>
        ))}
        {screen === "detail" && selectedLab && (
          <button
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              padding: "5px 12px",
              background: "none",
              border: "none",
              borderRadius: 3,
              cursor: "default",
              color: "#38BDF8",
              borderBottom: "2px solid #38BDF8",
            }}
          >
            {selectedLab.id.toUpperCase()}
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* System status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div className="pulse-dot-green" style={{ width: 7, height: 7, borderRadius: "50%", background: "#00FF9C" }} />
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#00FF9C", letterSpacing: "0.1em" }}>
          SYSTEM HEALTHY
        </span>
      </div>

      {/* User avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "linear-gradient(135deg, #00FF9C20, #38BDF820)",
        border: "1.5px solid #1C2A3A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem",
        color: "#00FF9C", fontWeight: 700, cursor: "pointer",
      }}>
        AD
      </div>
    </div>
  );
}

// ─── Lab Card ─────────────────────────────────────────────────────────────────
function LabCard({ lab, onView, onStop }: { lab: Lab; onView: () => void; onStop: () => void }) {
  const cpuHistory = [10, 15, 22, 18, 30, 28, lab.cpu, 32, lab.cpu - 3, lab.cpu];
  const memHistory = [200, 256, 300, 280, 320, 400, lab.memory, 480, lab.memory - 10, lab.memory];
  const timePct = (lab.timeRemaining / lab.totalTime) * 100;
  const ringColor = timePct < 25 ? "#FF4D6D" : timePct < 50 ? "#FFD166" : "#00FF9C";

  return (
    <div
      className="card-cyber"
      style={{ borderRadius: 8, overflow: "hidden", cursor: "pointer" }}
      onClick={onView}
    >
      {/* Top accent bar */}
      <div style={{
        height: 2,
        background: lab.status === "running"
          ? "linear-gradient(90deg, #00FF9C, #38BDF8)"
          : lab.status === "pending"
          ? "linear-gradient(90deg, #FFD166, #FF9500)"
          : "#1C2A3A",
      }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div style={{
              width: 36, height: 36, borderRadius: 6,
              background: "#0D1117", border: "1px solid #1C2A3A",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>
              {lab.appIcon}
            </div>
            <div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", fontWeight: 600, color: "#E8F4F8" }}>
                {lab.appType}
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478" }}>
                {lab.id} · {lab.namespace}
              </div>
            </div>
          </div>
          <StatusBadge status={lab.status} />
        </div>

        {/* Student */}
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", marginBottom: 14 }}>
          <span style={{ color: "#38BDF8" }}>@</span>{lab.student}
        </div>

        {/* Stats row */}
        {lab.status !== "stopped" ? (
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-end gap-4 mb-1">
                <div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478", marginBottom: 2 }}>CPU</div>
                  <Sparkline data={cpuHistory} color={lab.cpu > 70 ? "#FF4D6D" : "#00FF9C"} />
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: lab.cpu > 70 ? "#FF4D6D" : "#00FF9C", marginTop: 1 }}>
                    {lab.cpu > 0 ? `${lab.cpu}%` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478", marginBottom: 2 }}>MEM</div>
                  <Sparkline data={memHistory.map(v => v / 10)} color="#38BDF8" />
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#38BDF8", marginTop: 1 }}>
                    {lab.memory > 0 ? `${lab.memory}Mi` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Time ring */}
            <div className="flex flex-col items-center gap-1">
              <ProgressRing
                pct={timePct}
                size={52}
                stroke={3}
                color={ringColor}
                label={lab.timeRemaining > 0 ? `${lab.timeRemaining}m` : "0m"}
              />
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", color: "#4A6478" }}>
                TTL
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16, fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#4A6478" }}>
            Lab stopped · no resources active
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <button
            className="btn-accent"
            style={{ flex: 1, padding: "8px 12px", borderRadius: 4, fontSize: "0.65rem" }}
            onClick={onView}
          >
            {lab.status === "stopped" ? "→ VIEW" : "→ LAUNCH"}
          </button>
          {lab.status === "running" && (
            <button
              onClick={onStop}
              style={{
                width: 34, height: 34, borderRadius: 4,
                background: "transparent", border: "1px solid #1C2A3A",
                color: "#FF4D6D", cursor: "pointer", fontSize: "12px",
                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = "#FF4D6D";
                (e.target as HTMLElement).style.background = "rgba(255,77,109,0.1)";
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = "#1C2A3A";
                (e.target as HTMLElement).style.background = "transparent";
              }}
              title="Stop lab"
            >
              ■
            </button>
          )}
          {lab.status === "running" && (
            <button
              style={{
                width: 34, height: 34, borderRadius: 4,
                background: "transparent", border: "1px solid #1C2A3A",
                color: "#8BA5BB", cursor: "pointer", fontSize: "11px",
                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = "#38BDF8";
                (e.target as HTMLElement).style.color = "#38BDF8";
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = "#1C2A3A";
                (e.target as HTMLElement).style.color = "#8BA5BB";
              }}
              title="Extend time"
            >
              +T
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Deploy Modal ─────────────────────────────────────────────────────────────
function DeployModal({ onClose, onDeployed }: { onClose: () => void; onDeployed: () => void }) {
  const [selectedType, setSelectedType] = useState("juice-shop");
  const [ttl, setTtl] = useState(60);
  const [phase, setPhase] = useState<"form" | "provisioning" | "done" | "error">("form");
  const [provisionStep, setProvisionStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const provisionSteps = [
    "Creating namespace...",
    "Applying NetworkPolicy & ResourceQuota...",
    "Installing Helm chart " + (LAB_TYPES.find(l => l.id === selectedType)?.name || "") + "...",
    "Waiting for Pod to become ready...",
    "Registering Ingress route...",
    "Lab deployed successfully ✓",
  ];

  const handleDeploy = async () => {
    setPhase("provisioning");
    // Animate through the visual steps while the real request is in flight
    let step = 0;
    const stepper = setInterval(() => {
      step++;
      if (step < provisionSteps.length - 1) setProvisionStep(step);
    }, 500);

    try {
      await deployLab(selectedType);
      clearInterval(stepper);
      setProvisionStep(provisionSteps.length - 1);
      setTimeout(() => {
        onDeployed();
        setPhase("done");
      }, 400);
    } catch (e) {
      clearInterval(stepper);
      setErrorMsg(e instanceof Error ? e.message : "Deploy failed");
      setPhase("error");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(10,14,20,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, backdropFilter: "blur(4px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-slide-in-right"
        style={{
          background: "#111820", border: "1px solid #1C2A3A",
          borderRadius: 10, width: "100%", maxWidth: 540,
          maxHeight: "90vh", overflow: "auto",
          boxShadow: "0 0 60px rgba(0,255,156,0.08), 0 30px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1C2A3A",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", fontWeight: 700, color: "#00FF9C", margin: 0 }}>
              + DEPLOY NEW LAB
            </h2>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478", margin: "4px 0 0" }}>
              Provision an isolated Kubernetes namespace
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4A6478", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>

        <div style={{ padding: "24px" }}>
          {phase === "form" && (
            <>
              {/* Lab type selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                  SELECT LAB TYPE
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {LAB_TYPES.map(lt => (
                    <button
                      key={lt.id}
                      onClick={() => setSelectedType(lt.id)}
                      style={{
                        background: selectedType === lt.id ? `${lt.color}12` : "#0D1117",
                        border: `1px solid ${selectedType === lt.id ? lt.color : "#1C2A3A"}`,
                        borderRadius: 6, padding: "12px", cursor: "pointer",
                        textAlign: "left", transition: "all 0.2s",
                        boxShadow: selectedType === lt.id ? `0 0 12px ${lt.color}25` : "none",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: "18px" }}>{lt.icon}</span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", fontWeight: 600, color: selectedType === lt.id ? lt.color : "#E8F4F8" }}>
                          {lt.name}
                        </span>
                      </div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: "#8BA5BB" }}>{lt.desc}</div>
                      <div style={{
                        display: "inline-block", marginTop: 6,
                        fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem",
                        color: lt.color, border: `1px solid ${lt.color}50`,
                        borderRadius: 2, padding: "1px 6px", letterSpacing: "0.1em",
                      }}>
                        {lt.tag}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* TTL slider */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478", letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>LAB LIFETIME (TTL)</span>
                  <span style={{ color: "#00FF9C" }}>{ttl} MINUTES</span>
                </label>
                <input
                  type="range" min={15} max={180} step={15} value={ttl}
                  onChange={e => setTtl(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#00FF9C" }}
                />
                <div className="flex justify-between" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", color: "#4A6478", marginTop: 4 }}>
                  <span>15m</span><span>45m</span><span>90m</span><span>180m</span>
                </div>
              </div>

              <button
                onClick={handleDeploy}
                className="btn-accent"
                style={{
                  width: "100%", padding: "12px", borderRadius: 4,
                  fontSize: "0.75rem", letterSpacing: "0.15em",
                }}
              >
                ⚡ PROVISION LAB
              </button>
            </>
          )}

          {phase === "provisioning" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: "2px solid #00FF9C",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12, animation: "glow-pulse 1.5s ease-in-out infinite",
                }}>
                  <span style={{ fontSize: "24px" }}>⚙️</span>
                </div>
                <h3 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.8rem", color: "#00FF9C", fontWeight: 700 }}>
                  PROVISIONING...
                </h3>
              </div>
              <div style={{
                background: "#0D1117", border: "1px solid #1C2A3A", borderRadius: 6,
                padding: "16px", fontFamily: "JetBrains Mono, monospace",
              }}>
                {provisionSteps.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.7rem",
                      color: i < provisionStep ? "#00FF9C" : i === provisionStep ? "#FFD166" : "#1C2A3A",
                      padding: "3px 0",
                      transition: "color 0.3s",
                    }}
                  >
                    {i < provisionStep ? "✓ " : i === provisionStep ? "→ " : "  "}{step}
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div style={{ height: 3, background: "#1C2A3A", borderRadius: 2, marginTop: 16, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(provisionStep / provisionSteps.length) * 100}%`,
                  background: "linear-gradient(90deg, #00FF9C, #38BDF8)",
                  transition: "width 0.5s ease",
                  borderRadius: 2,
                }} />
              </div>
            </div>
          )}

          {phase === "done" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: "2px solid #00FF9C",
                background: "rgba(0,255,156,0.08)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
                boxShadow: "0 0 30px rgba(0,255,156,0.3)",
              }}>
                <span style={{ fontSize: "28px" }}>✓</span>
              </div>
              <h3 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.9rem", color: "#00FF9C", fontWeight: 700, marginBottom: 8 }}>
                LAB DEPLOYED
              </h3>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#8BA5BB", marginBottom: 20 }}>
                Your new lab is coming online — it'll appear on the dashboard shortly.
              </p>
              <button onClick={onClose} className="btn-accent" style={{ padding: "10px 32px", borderRadius: 4, fontSize: "0.7rem" }}>
                BACK TO DASHBOARD →
              </button>
            </div>
          )}

          {phase === "error" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: "2px solid #FF4D6D",
                background: "rgba(255,77,109,0.08)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <span style={{ fontSize: "28px" }}>✕</span>
              </div>
              <h3 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.9rem", color: "#FF4D6D", fontWeight: 700, marginBottom: 8 }}>
                DEPLOY FAILED
              </h3>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", marginBottom: 20, wordBreak: "break-word" }}>
                {errorMsg}
              </p>
              <button onClick={() => setPhase("form")} className="btn-accent" style={{ padding: "10px 32px", borderRadius: 4, fontSize: "0.7rem" }}>
                TRY AGAIN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
function DashboardScreen({
  labs,
  onViewLab,
  onStopLab,
  onLabDeployed,
}: {
  labs: Lab[];
  onViewLab: (lab: Lab) => void;
  onStopLab: (id: string) => void;
  onLabDeployed: () => void;
}) {
  const [showDeploy, setShowDeploy] = useState(false);
  const running = labs.filter(l => l.status === "running").length;
  const pending = labs.filter(l => l.status === "pending").length;

  return (
    <div className="circuit-bg min-h-screen" style={{ padding: "24px" }}>
      {/* Summary stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "ACTIVE LABS", value: running, color: "#00FF9C", icon: "▶" },
          { label: "PENDING", value: pending, color: "#FFD166", icon: "⏳" },
          { label: "TOTAL STUDENTS", value: labs.length, color: "#38BDF8", icon: "👤" },
          { label: "CLUSTER HEALTH", value: "99.8%", color: "#00FF9C", icon: "💚" },
        ].map((s, i) => (
          <div key={i} className="card-cyber" style={{
            flex: "1 1 160px", borderRadius: 8, padding: "14px 18px",
          }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", color: "#4A6478", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {s.label}
              </span>
              <span style={{ fontSize: "12px" }}>{s.icon}</span>
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "1.6rem", fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}

        {/* Deploy button */}
        <button
          onClick={() => setShowDeploy(true)}
          className="btn-accent glow-border"
          style={{
            flex: "0 0 auto", borderRadius: 8, padding: "14px 24px",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: "0.75rem", letterSpacing: "0.1em",
          }}
        >
          <span style={{ fontSize: "16px" }}>+</span>
          DEPLOY NEW LAB
        </button>
      </div>

      {/* Section header */}
      <div className="flex items-center gap-3 mb-16px" style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#4A6478", letterSpacing: "0.2em" }}>
          ACTIVE RANGES
        </span>
        <div style={{ flex: 1, height: 1, background: "#1C2A3A" }} />
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478" }}>
          {labs.length} labs
        </span>
      </div>

      {/* Lab grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {labs.map(lab => (
          <LabCard
            key={lab.id}
            lab={lab}
            onView={() => onViewLab(lab)}
            onStop={() => onStopLab(lab.id)}
          />
        ))}
      </div>

      {/* Pipeline strip */}
      <div className="card-cyber" style={{ marginTop: 32, borderRadius: 8, padding: "20px 24px" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478", letterSpacing: "0.2em", marginBottom: 16 }}>
          DEVOPS PIPELINE — BUILD STATUS
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 8 }}>
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center" style={{ flexShrink: 0 }}>
              <div style={{ textAlign: "center", width: 110 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: `2px solid ${step.done ? "#00FF9C" : "#1C2A3A"}`,
                  background: step.done ? "rgba(0,255,156,0.1)" : "#0D1117",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 8px",
                  boxShadow: step.done ? "0 0 12px rgba(0,255,156,0.25)" : "none",
                  transition: "all 0.3s",
                }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", color: step.done ? "#00FF9C" : "#4A6478", fontWeight: 700 }}>
                    {step.done ? "✓" : step.id}
                  </span>
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", fontWeight: 600, color: step.done ? "#E8F4F8" : "#4A6478" }}>
                  {step.label}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", color: "#4A6478", marginTop: 2 }}>
                  {step.desc}
                </div>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, minWidth: 20,
                  background: step.done && PIPELINE_STEPS[i + 1].done
                    ? "#00FF9C" : step.done
                    ? "linear-gradient(90deg, #00FF9C, #1C2A3A)"
                    : "#1C2A3A",
                  margin: "0 4px", marginBottom: 28,
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {showDeploy && (
        <DeployModal
          onClose={() => setShowDeploy(false)}
          onDeployed={() => {
            onLabDeployed();
            setTimeout(() => setShowDeploy(false), 1800);
          }}
        />
      )}
    </div>
  );
}

// ─── Lab Detail Screen ────────────────────────────────────────────────────────
function LabDetailScreen({ lab, onBack }: { lab: Lab; onBack: () => void }) {
  const logRef = useRef<HTMLDivElement>(null);
  const [logLines, setLogLines] = useState(LOG_LINES.slice(0, 8));

  useEffect(() => {
    const interval = setInterval(() => {
      setLogLines(prev => {
        const next = [...prev, LOG_LINES[prev.length % LOG_LINES.length]];
        return next.slice(-20);
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  const cpuData = [12, 28, 22, 45, 38, 34, 50, 42, lab.cpu, 36, lab.cpu + 4, lab.cpu];
  const memData = [200, 280, 300, 420, 380, 512, 490, 510, lab.memory, 505, 520, lab.memory];

  return (
    <div className="circuit-bg min-h-screen" style={{ padding: "24px" }}>
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          style={{
            background: "none", border: "1px solid #1C2A3A", borderRadius: 4,
            color: "#8BA5BB", cursor: "pointer", padding: "5px 12px",
            fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#38BDF8")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "#1C2A3A")}
        >
          ← BACK
        </button>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: "28px" }}>{lab.appIcon}</span>
            <div>
              <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "1.1rem", fontWeight: 700, color: "#E8F4F8", margin: 0 }}>
                {lab.appType} <span style={{ color: "#4A6478", fontWeight: 400 }}>/ {lab.id}</span>
              </h2>
              <div className="flex items-center gap-3">
                <StatusBadge status={lab.status} />
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478" }}>
                  ns:{lab.namespace}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lab.status === "running" && lab.url && (
            <button
              onClick={() => window.open(lab.url, "_blank", "noopener,noreferrer")}
              className="btn-accent"
              style={{ padding: "10px 18px", borderRadius: 4, fontSize: "0.7rem", letterSpacing: "0.08em" }}
            >
              OPEN APP ↗
            </button>
          )}
          <ProgressRing pct={(lab.timeRemaining / lab.totalTime) * 100} size={64} stroke={4} color="#00FF9C" label={`${lab.timeRemaining}m`} />
        </div>
      </div>

      {/* Main layout: browser mock + stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
        {/* Browser mock */}
        <div className="card-cyber" style={{ borderRadius: 8, overflow: "hidden" }}>
          {/* Browser chrome */}
          <div style={{ background: "#0D1117", borderBottom: "1px solid #1C2A3A", padding: "10px 16px" }}>
            <div className="flex items-center gap-2 mb-2">
              {["#FF4D6D", "#FFD166", "#00FF9C"].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
              ))}
            </div>
            <div style={{
              background: "#111820", border: "1px solid #1C2A3A", borderRadius: 4,
              padding: "5px 12px", fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.65rem", color: "#8BA5BB",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ color: "#4A6478" }}>🔒</span>
              <span>{lab.url || "no URL yet"}</span>
              <span style={{ marginLeft: "auto", color: "#4A6478", fontSize: "0.55rem" }}>ISOLATED</span>
            </div>
          </div>

          {/* Simulated app content */}
          <div style={{
            height: 320, background: "#0a0a0a",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            {/* Juice Shop mock */}
            <div style={{
              width: "85%", height: "80%",
              background: "#1a1a2e",
              borderRadius: 4, overflow: "hidden",
              border: "1px solid #16213e",
            }}>
              <div style={{ background: "#e91e63", height: 48, display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
                <span style={{ fontSize: "18px" }}>{lab.appIcon}</span>
                <span style={{ color: "white", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.9rem" }}>
                  {lab.appType}
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  {["Home", "Products", "Login", "Admin"].map(t => (
                    <span key={t} style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.7rem" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {["Apple Juice", "Banana Juice", "Eggfruit Juice", "Fruit Press"].map((item, i) => (
                  <div key={i} style={{
                    width: 100, height: 80, background: "#16213e",
                    borderRadius: 4, border: "1px solid #0f3460",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 4,
                  }}>
                    <span style={{ fontSize: "20px" }}>🧃</span>
                    <span style={{ fontSize: "0.55rem", color: "#ccc", textAlign: "center" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
            }} />
          </div>
        </div>

        {/* Right: resource stats */}
        <div className="flex flex-col gap-3">
          {/* CPU chart */}
          <div className="card-cyber" style={{ borderRadius: 8, padding: "16px" }}>
            <MiniLineChart data={cpuData} color="#00FF9C" label="CPU UTILIZATION" width={280} height={60} />
          </div>
          <div className="card-cyber" style={{ borderRadius: 8, padding: "16px" }}>
            <div className="flex justify-between items-center mb-1">
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", letterSpacing: "0.08em" }}>MEMORY</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#38BDF8" }}>{lab.memory}Mi</span>
            </div>
            <MiniLineChart data={memData.map(v => Math.round(v / 10))} color="#38BDF8" label="MEM UTILIZATION" width={280} height={60} />
          </div>

          {/* K8s info */}
          <div className="card-cyber" style={{ borderRadius: 8, padding: "16px" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478", letterSpacing: "0.15em", marginBottom: 10 }}>
              K8S RESOURCES
            </div>
            {[
              ["Namespace", lab.namespace],
              ["Pod", `${lab.appType.toLowerCase().replace(" ", "-")}-7d9f4b`],
              ["Service", "Ingress (ClusterIP)"],
              ["Helm Release", `${lab.id}-release`],
              ["Policy", "restricted"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between" style={{ padding: "3px 0", borderBottom: "1px solid #0D1117" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478" }}>{k}</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#8BA5BB" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log stream */}
      <div className="card-cyber" style={{ borderRadius: 8, overflow: "hidden" }}>
        <div style={{
          background: "#0D1117", padding: "10px 16px", borderBottom: "1px solid #1C2A3A",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div className="pulse-dot-green" style={{ width: 7, height: 7, borderRadius: "50%", background: "#00FF9C" }} />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#4A6478", letterSpacing: "0.2em" }}>
            LOG STREAM — {lab.namespace}
          </span>
          <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", color: "#4A6478" }}>
            LIVE
          </span>
        </div>
        <div
          ref={logRef}
          style={{
            background: "#080D10", height: 180, overflowY: "auto",
            padding: "12px 16px", scrollBehavior: "smooth",
          }}
        >
          {logLines.map((line, i) => {
            const isWarn = line.includes("WARN");
            const isDebug = line.includes("DEBUG");
            return (
              <div key={i} style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.65rem",
                color: isWarn ? "#FFD166" : isDebug ? "#4A6478" : "#00FF9C",
                lineHeight: 1.7,
                opacity: i === logLines.length - 1 ? 1 : 0.85,
              }}>
                {line}
              </div>
            );
          })}
          <span style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem",
            color: "#00FF9C", animation: "blink-cursor 0.8s step-end infinite",
          }}>█</span>
        </div>
      </div>
    </div>
  );
}

// ─── Monitoring Screen ────────────────────────────────────────────────────────
function MonitoringScreen({ labs }: { labs: Lab[] }) {
  const generateSeries = (base: number, len = 24) =>
    Array.from({ length: len }, (_, i) => Math.max(0, Math.min(100, base + Math.sin(i * 0.5) * 15 + (Math.random() - 0.5) * 10)));

  const timeLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

  const MultiLineSVG = ({
    series,
    colors,
    width = 360,
    height = 100,
  }: {
    series: number[][];
    colors: string[];
    width?: number;
    height?: number;
  }) => {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        <line x1={0} y1={height - 0.5} x2={width} y2={height - 0.5} stroke="#1C2A3A" strokeWidth="0.5" />
        {[0, 25, 50, 75].map(pct => (
          <line key={pct} x1={0} y1={(1 - pct / 100) * height} x2={width} y2={(1 - pct / 100) * height} stroke="#1C2A3A" strokeWidth="0.5" opacity="0.5" />
        ))}
        {series.map((s, si) => {
          const pts = s.map((v, i) => `${(i / (s.length - 1)) * width},${height - (v / 100) * (height - 8) - 4}`).join(" ");
          return (
            <g key={si}>
              <polyline points={pts} stroke={colors[si]} strokeWidth="1.5" fill="none" opacity="0.9" />
              <circle
                cx={(s.length - 1) / (s.length - 1) * width}
                cy={height - (s[s.length - 1] / 100) * (height - 8) - 4}
                r="3" fill={colors[si]}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  const labCpuSeries = labs.filter(l => l.status === "running").map(l => generateSeries(l.cpu));
  const labColors = ["#00FF9C", "#38BDF8", "#FFD166", "#8B5CF6"];

  const activeOverTime = Array.from({ length: 24 }, (_, i) => Math.floor(1 + Math.random() * 3 + (i > 8 && i < 18 ? 2 : 0)));

  return (
    <div className="circuit-bg min-h-screen" style={{ padding: "24px" }}>
      <div className="flex items-center gap-3 mb-6">
        <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", fontWeight: 700, color: "#E8F4F8", margin: 0 }}>
          MONITORING OVERVIEW
        </h2>
        <div style={{ flex: 1, height: 1, background: "#1C2A3A" }} />
        <div className="flex items-center gap-2">
          <div className="pulse-dot-green" style={{ width: 7, height: 7, borderRadius: "50%", background: "#00FF9C" }} />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#00FF9C" }}>PROMETHEUS CONNECTED</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "AVG CPU", value: "28%", sub: "across all labs", color: "#00FF9C" },
          { label: "AVG MEMORY", value: "384Mi", sub: "per namespace", color: "#38BDF8" },
          { label: "UPTIME", value: "99.8%", sub: "last 30 days", color: "#00FF9C" },
          { label: "LABS TODAY", value: "12", sub: "total sessions", color: "#FFD166" },
        ].map((k, i) => (
          <div key={i} className="card-cyber" style={{ borderRadius: 8, padding: "16px 18px" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", color: "#4A6478", letterSpacing: "0.2em", marginBottom: 6 }}>
              {k.label}
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "1.5rem", fontWeight: 700, color: k.color }}>
              {k.value}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: "#4A6478", marginTop: 2 }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* CPU across labs */}
        <div className="card-cyber" style={{ borderRadius: 8, padding: "18px" }}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", letterSpacing: "0.1em" }}>
              CPU — ALL ACTIVE LABS
            </span>
            <div className="flex gap-3">
              {labs.filter(l => l.status === "running").map((l, i) => (
                <div key={l.id} className="flex items-center gap-1">
                  <div style={{ width: 8, height: 2, background: labColors[i] }} />
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", color: "#4A6478" }}>{l.student.replace("student-", "")}</span>
                </div>
              ))}
            </div>
          </div>
          <MultiLineSVG series={labCpuSeries} colors={labColors} width={380} height={100} />
          <div className="flex justify-between" style={{ marginTop: 4 }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.5rem", color: "#4A6478" }}>00:00</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.5rem", color: "#4A6478" }}>12:00</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.5rem", color: "#4A6478" }}>24:00</span>
          </div>
        </div>

        {/* Active labs over time */}
        <div className="card-cyber" style={{ borderRadius: 8, padding: "18px" }}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", letterSpacing: "0.1em" }}>
              ACTIVE LABS — TODAY
            </span>
          </div>
          <svg width="380" height="100" viewBox="0 0 380 100" fill="none">
            {activeOverTime.map((v, i) => {
              const barW = 380 / 24 - 2;
              const barH = (v / 6) * 80;
              return (
                <g key={i}>
                  <rect
                    x={i * (380 / 24) + 1}
                    y={100 - barH - 4}
                    width={barW}
                    height={barH}
                    fill="#38BDF8"
                    opacity={i === 23 ? 1 : 0.5}
                    rx="1"
                  />
                </g>
              );
            })}
          </svg>
          <div className="flex justify-between" style={{ marginTop: 4 }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.5rem", color: "#4A6478" }}>00:00</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.5rem", color: "#4A6478" }}>12:00</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.5rem", color: "#4A6478" }}>NOW</span>
          </div>
        </div>
      </div>

      {/* Memory + uptime gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* Memory per lab */}
        <div className="card-cyber" style={{ borderRadius: 8, padding: "18px" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", letterSpacing: "0.1em", marginBottom: 16 }}>
            MEMORY / NAMESPACE
          </div>
          {labs.filter(l => l.status === "running").map((l, i) => (
            <div key={l.id} style={{ marginBottom: 10 }}>
              <div className="flex justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#8BA5BB" }}>
                  {l.student.replace("student-", "")}
                </span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: labColors[i] }}>
                  {l.memory}Mi / 1Gi
                </span>
              </div>
              <div style={{ height: 4, background: "#1C2A3A", borderRadius: 2 }}>
                <div style={{
                  height: "100%", width: `${(l.memory / 1024) * 100}%`,
                  background: labColors[i], borderRadius: 2,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Uptime rings */}
        <div className="card-cyber" style={{ borderRadius: 8, padding: "18px" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", letterSpacing: "0.1em", marginBottom: 16 }}>
            CLUSTER UPTIME
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Cluster", pct: 99.8, color: "#00FF9C" },
              { label: "API", pct: 100, color: "#38BDF8" },
              { label: "Storage", pct: 97.2, color: "#FFD166" },
            ].map(g => (
              <div key={g.label} style={{ textAlign: "center" }}>
                <ProgressRing pct={g.pct} size={64} stroke={5} color={g.color} label={`${g.pct}%`} />
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", color: "#4A6478", marginTop: 4 }}>
                  {g.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event log */}
        <div className="card-cyber" style={{ borderRadius: 8, padding: "18px", overflow: "hidden" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: "#8BA5BB", letterSpacing: "0.1em", marginBottom: 12 }}>
            RECENT EVENTS
          </div>
          {[
            { time: "09:14", msg: "Lab alice: deployed", c: "#00FF9C" },
            { time: "09:12", msg: "Lab bob: TTL warning", c: "#FFD166" },
            { time: "09:10", msg: "Lab carol: pending", c: "#FFD166" },
            { time: "08:55", msg: "Lab dan: auto-cleaned", c: "#FF4D6D" },
            { time: "08:30", msg: "Cluster: node ready", c: "#38BDF8" },
            { time: "08:00", msg: "Prom: scrape interval 15s", c: "#4A6478" },
          ].map((ev, i) => (
            <div key={i} className="flex items-center gap-2" style={{ padding: "4px 0", borderBottom: "1px solid #0D1117" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", color: "#4A6478", width: 35, flexShrink: 0 }}>
                {ev.time}
              </span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: ev.c }}>
                {ev.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshLabs = async () => {
    try {
      const backendLabs = await fetchLabs();
      setLabs(backendLabs.map(mapBackendLab));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load labs");
    }
  };

  // Fetch real labs once logged in, then poll every 5s so the dashboard stays live
  useEffect(() => {
    if (screen === "login") return;
    refreshLabs();
    const interval = setInterval(refreshLabs, 5000);
    return () => clearInterval(interval);
  }, [screen]);

  const handleStopLab = async (id: string) => {
    try {
      await deleteLab(id);
      await refreshLabs();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to delete lab");
    }
  };

  const handleViewLab = (lab: Lab) => {
    setSelectedLab(lab);
    setScreen("detail");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E14" }}>
      {screen === "login" ? (
        <LoginScreen onLogin={() => setScreen("dashboard")} />
      ) : (
        <>
          <TopNav screen={screen} onNavigate={setScreen} selectedLab={selectedLab} />
          {loadError && (
            <div style={{
              background: "#2A0F14", border: "1px solid #FF4D6D", color: "#FF4D6D",
              fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem",
              padding: "10px 24px",
            }}>
              ⚠ {loadError} — is the backend running at http://127.0.0.1:8000?
            </div>
          )}
          {screen === "dashboard" && (
            <DashboardScreen
              labs={labs}
              onViewLab={handleViewLab}
              onStopLab={handleStopLab}
              onLabDeployed={refreshLabs}
            />
          )}
          {screen === "detail" && selectedLab && (
            <LabDetailScreen lab={selectedLab} onBack={() => setScreen("dashboard")} />
          )}
          {screen === "monitoring" && <MonitoringScreen labs={labs} />}
        </>
      )}
    </div>
  );
}
