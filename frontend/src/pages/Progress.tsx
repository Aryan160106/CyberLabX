import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Target,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchProgress } from "../api";
import type { ProgressData } from "../api";

const MISSION_TARGET = 30;

const MISSION_TOTALS: Record<string, string> = {
  "OWASP Juice Shop": "100+",
  DVWA: "19",
  bWAPP: "100+",
};

function Progress() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProgressData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchProgress().then(setData).catch(() => setFailed(true));
  }, []);

  const current = data?.current ?? null;
  const completedStages = (data?.labs ?? []).flatMap((lab) =>
    lab.stages.filter((s) => s.done).map((s) => ({ lab: lab.name, stage: s.label })),
  );

  return (
    <div className="progress-page">
      <div className="progress-header">
        <div>
          <span className="eyebrow">SKILL DEVELOPMENT</span>
          <h1>Progress</h1>
          <p>
            Track completed training, developing skills, and your next area of
            practice.
          </p>
        </div>
      </div>

      {failed && <p role="alert">Could not load your progress.</p>}

      {current && (
        <section className="progress-overview">
          <div className="progress-overview-main">
            <span className="card-label">CURRENT TRAINING</span>
            <h2>{current.name}</h2>
            <p>
              {current.stages.filter((s) => s.done).length} of{" "}
              {current.stages.length} stages complete.
            </p>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${current.progress}%` }}
              />
            </div>

            <div className="progress-meta">
              <span>Lab progress</span>
              <strong>{current.progress}%</strong>
            </div>
          </div>

          <div className="progress-overview-status">
            <CheckCircle2 size={20} />
            <span>{current.progress === 100 ? "COMPLETE" : "IN PROGRESS"}</span>
          </div>
        </section>
      )}

      <section className="progress-panel" style={{ marginBottom: 24 }}>
        <div className="panel-heading">
          <div>
            <span className="card-label">ALL LABS</span>
            <h2>Lab Progress</h2>
          </div>
          <Target size={20} />
        </div>

        {data?.labs.map((lab) => {
          const solved = lab.stages.some((s) => s.label === "Evaluate" && s.done) ? 1 : 0;
          return (
            <div key={lab.name} style={{ padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{lab.name}</strong>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {lab.stages.map((s) => s.label + ": " + (s.done ? "done" : "pending")).join(" | ")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: lab.progress + "%", height: "100%", background: "#b6f23a", transition: "width 0.4s" }} />
                </div>
                <strong style={{ minWidth: 44, textAlign: "right" }}>{lab.progress}%</strong>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8 }}>
                  <span>
                    Missions: {solved} / {MISSION_TARGET} (1 live, more coming) | Full app: {MISSION_TOTALS[lab.name] ?? "more"} challenges
                  </span>
                  <span>{Math.round((100 * solved) / MISSION_TARGET)}%</span>
                </div>
                <div style={{ height: 6, marginTop: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: Math.round((100 * solved) / MISSION_TARGET) + "%", height: "100%", background: "#4cc9f0", transition: "width 0.4s" }} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="progress-grid">
        <section className="progress-panel">
          <div className="panel-heading">
            <div>
              <span className="card-label">SKILLS</span>
              <h2>Security Skills</h2>
            </div>
            <Target size={20} />
          </div>

          {data?.skills.map((skill) => (
            <div className="skill-row" key={skill.category}>
              <div className="skill-info">
                <strong>{skill.category}</strong>
                <span>
                  {skill.earned} / {skill.max} XP
                </span>
              </div>

              <div className="skill-bar">
                <div style={{ width: `${skill.percent}%` }} />
              </div>

              <strong className="skill-value">{skill.percent}%</strong>
            </div>
          ))}
        </section>

        <section className="progress-panel">
          <div className="panel-heading">
            <div>
              <span className="card-label">ACTIVITY</span>
              <h2>Completed Training</h2>
            </div>
            <Trophy size={20} />
          </div>

          {completedStages.map((item) => (
            <div className="activity-row" key={item.lab + item.stage}>
              <div className="activity-icon">
                <BookOpen size={17} />
              </div>
              <div>
                <strong>{item.stage}</strong>
                <span>{item.lab}</span>
              </div>
              <CheckCircle2 size={17} />
            </div>
          ))}

          {data && completedStages.length === 0 && (
            <div className="activity-row">
              <div>
                <strong>Nothing completed yet</strong>
                <span>Finish a quiz or capture a flag to see it here</span>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="progress-next">
        <div>
          <span className="card-label">NEXT RECOMMENDATION</span>
          <h2>
            {data?.recommended
              ? `Continue ${data.recommended.name}`
              : "All available labs complete"}
          </h2>
          <p>
            {data?.recommended
              ? `${data.recommended.reason}. This is a simple rule, not AI.`
              : "New labs will appear as they are added."}
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() =>
            navigate(data?.recommended ? `/labs/${data.recommended.lab_id}` : "/labs")
          }
        >
          {data?.recommended ? "Open Lab" : "Explore Labs"}
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}

export default Progress;