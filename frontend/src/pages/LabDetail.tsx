import { ArrowLeft, Clock3, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { labs } from "../data/labData";

function LabDetail() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();

  const lab = labs.find((item) => item.id === labId);

  if (!lab) {
    return (
      <div className="lab-detail">
        <span className="eyebrow">LAB ERROR</span>

        <h1>Lab not found</h1>

        <p>The requested training environment does not exist.</p>

        <button
          className="primary-button"
          type="button"
          onClick={() => navigate("/labs")}
        >
          Back to Labs
        </button>
      </div>
    );
  }

  return (
    <div className="lab-detail">
      <button
        className="back-button"
        type="button"
        onClick={() => navigate("/labs")}
      >
        <ArrowLeft size={15} />
        Back to Labs
      </button>

      <div className="lab-detail-header">
        <div>
          <span className="eyebrow">{lab.category}</span>

          <h1>{lab.name}</h1>

          <p>{lab.description}</p>
        </div>

        <div className="lab-detail-status">
          <ShieldCheck size={18} />
          {lab.status}
        </div>
      </div>

      <div className="lab-detail-meta">
        <div>
          <span>DIFFICULTY</span>
          <strong>{lab.difficulty}</strong>
        </div>

        <div>
          <span>DURATION</span>

          <strong>
            <Clock3 size={14} />
            {lab.duration}
          </strong>
        </div>
      </div>

      <div className="lab-detail-grid">
        <section className="detail-panel">
          <span className="card-label">WHAT YOU'LL LEARN</span>

          <h2>Learning objectives</h2>

          <ul>
            {lab.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </section>

        <section className="detail-panel">
          <span className="card-label">SECURITY TOPICS</span>

          <h2>Vulnerabilities covered</h2>

          <ul>
            {lab.vulnerabilities.map((vulnerability) => (
              <li key={vulnerability}>{vulnerability}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="lab-start-panel">
        <div>
          <span className="card-label">NEXT STEP</span>

          <h2>Ready to start learning?</h2>

          <p>
            Review the concepts first, then enter the disposable practice
            environment.
          </p>
        </div>

        <button
  className="primary-button"
  type="button"
  onClick={() => navigate(`/labs/${lab.id}/learning`)}
>
  Start Learning
</button>
      </div>
    </div>
  );
}

export default LabDetail;