import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FlaskConical,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { fetchProgress } from "../api";
import type { ProgressData } from "../api";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchProgress().then(setData).catch(() => setFailed(true));
  }, []);

  const current = data?.current ?? null;
  const activeIndex = current ? current.stages.findIndex((s) => !s.done) : -1;

  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <span className="eyebrow">STUDENT CONSOLE</span>

          <h1>Welcome back, {user?.display_name}</h1>

          <p>
            Pick up where you left off and keep building practical security
            skills through guided labs.
          </p>
        </div>

        <div className="dashboard-intro-status">
          <span className="status-dot" />
          {data ? `${data.xp.toLocaleString()} XP earned` : "Loading progress"}
        </div>
      </section>

      {failed && <p role="alert">Could not load your progress.</p>}

      {current && (
        <>
          <section className="dashboard-feature">
            <div className="dashboard-feature-main">
              <div className="dashboard-feature-icon">
                <FlaskConical size={20} />
              </div>

              <div>
                <span className="card-label">CURRENT LAB</span>

                <h2>{current.name}</h2>

                <p>{current.category}</p>
              </div>
            </div>

            <div className="dashboard-feature-progress">
              <div className="dashboard-progress-header">
                <span>LAB PROGRESS</span>
                <strong>{current.progress}%</strong>
              </div>

              <div className="dashboard-progress-track">
                <div
                  className="dashboard-progress-value"
                  style={{ width: `${current.progress}%` }}
                />
              </div>

              <div className="dashboard-progress-meta">
                <span>
                  {current.stages.filter((s) => s.done).length} of{" "}
                  {current.stages.length} stages complete
                </span>

                <button
                  className="dashboard-link"
                  type="button"
                  onClick={() => navigate(`/labs/${current.lab_id}`)}
                >
                  Continue
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </section>

          <div className="dashboard-section-heading">
            <div>
              <span className="card-label">TRAINING PATH</span>
              <h2>Your current progress</h2>
            </div>
          </div>

          <section className="dashboard-path">
            {current.stages.map((stage, i) => {
              const state = stage.done ? "completed" : i === activeIndex ? "active" : "";
              return (
                <div key={stage.key} style={{ display: "contents" }}>
                  {i > 0 && (
                    <div
                      className={`dashboard-path-line ${
                        current.stages[i - 1].done ? "completed" : ""
                      }`}
                    />
                  )}
                  <div className={`dashboard-path-step ${state}`}>
                    <div className="dashboard-path-icon">
                      {stage.done ? (
                        <CheckCircle2 size={17} />
                      ) : i === activeIndex ? (
                        <Target size={17} />
                      ) : (
                        <ShieldCheck size={17} />
                      )}
                    </div>

                    <div>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <strong>{stage.label}</strong>
                      <small>
                        {stage.done
                          ? "Complete"
                          : i === activeIndex
                            ? "Current stage"
                            : "Not started"}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}

      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <span className="card-label">SKILL DEVELOPMENT</span>
              <h3>Security skills</h3>
            </div>

            <ShieldCheck size={18} />
          </div>

          {data?.skills.map((skill) => (
            <div className="skill-row" key={skill.category}>
              <div className="skill-info">
                <span>{skill.category}</span>
                <strong>{skill.percent}%</strong>
              </div>

              <div className="skill-track">
                <div
                  className="skill-value"
                  style={{ width: `${skill.percent}%` }}
                />
              </div>
            </div>
          ))}

          {data && data.skills.length === 0 && <p>No skill data yet.</p>}
        </article>

        <article className="dashboard-panel dashboard-next">
          <span className="card-label">RECOMMENDED NEXT</span>

          <div className="dashboard-next-icon">
            <BookOpen size={18} />
          </div>

          {data?.recommended ? (
            <>
              <h3>{data.recommended.name}</h3>
              <p>{data.recommended.reason}. This is a simple rule, not AI.</p>
              <button
                className="dashboard-link"
                type="button"
                onClick={() => navigate(`/labs/${data.recommended!.lab_id}`)}
              >
                Open lab
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <h3>All available labs complete</h3>
              <p>New labs will appear here as they are added.</p>
              <button
                className="dashboard-link"
                type="button"
                onClick={() => navigate("/labs")}
              >
                Explore Labs
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </article>
      </section>

      <section className="dashboard-lower">
        <div className="dashboard-lower-heading">
          <div>
            <span className="card-label">RECENT ACTIVITY</span>
            <h2>Training activity</h2>
          </div>
        </div>

        <div className="activity-list">
          {data?.activity.map((item) => (
            <div className="activity-item" key={item.at + item.title}>
              <div className="activity-icon">
                {item.title === "Flag captured" ? (
                  <Target size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
              </div>

              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>

              <time>{new Date(item.at).toLocaleString()}</time>
            </div>
          ))}

          {data && data.activity.length === 0 && (
            <div className="activity-item">
              <div className="activity-icon">
                <Clock3 size={16} />
              </div>
              <div>
                <strong>No activity yet</strong>
                <span>Take a quiz or launch a lab to get started</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;