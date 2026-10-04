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