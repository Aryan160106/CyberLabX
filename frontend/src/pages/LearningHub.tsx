import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { labs } from "../data/labData";

type LastLab = { labId: string; path: string };

const STAGES: Record<string, string> = {
  learning: "Concept",
  quiz: "Quick quiz",
  practice: "Practice",
};

function getLastLab(): LastLab | null {
  try {
    const raw = localStorage.getItem("cyberlabx:lastLab");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastLab;
    const ok = labs.some(
      (l) => l.id === parsed.labId && l.status === "Available"
    );
    return ok ? parsed : null;
  } catch {
    return null;
  }
}

function LearningHub() {
  const navigate = useNavigate();

  const last = getLastLab();
  const fallback = labs.find((l) => l.status === "Available") ?? labs[0];
  const current = labs.find((l) => l.id === last?.labId) ?? fallback;
  const continuePath = last?.path ?? `/labs/${current.id}/learning`;
  const stage = last ? STAGES[last.path.split("/").pop() ?? ""] : null;

  return (
    <div className="learning-page">
      <header className="learning-header">
        <span className="eyebrow">LEARNING</span>
        <h1>Learning</h1>
        <p>Pick up where you left off, or open a lab directly.</p>
      </header>

      <section className="hub-continue">
        <div>
          <span className="card-label">
            {last ? "CONTINUE LEARNING" : "START LEARNING"}
          </span>
          <h2>{current.name}</h2>
          <p>{stage ? `Last stage: ${stage}` : current.description}</p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate(continuePath)}
          >
            {last ? "Continue" : "Start"} <ArrowRight size={15} />
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={() => navigate(`/labs/${current.id}/practice`)}
          >
            Open Lab
          </button>
        </div>
      </section>

      <span className="card-label">ALL LABS</span>

      <div className="hub-list">
        {labs.map((lab) => (
          <div className="hub-row" key={lab.id}>
            <div>
              <strong>{lab.name}</strong>
              <br />
              <small>
                {lab.category} · {lab.difficulty} · {lab.duration}
              </small>
            </div>

            {lab.status === "Available" ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => navigate(`/labs/${lab.id}/practice`)}
              >
                Open Lab
              </button>
            ) : (
              <span className="card-label">COMING SOON</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearningHub;
