
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Target,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Progress() {
  const navigate = useNavigate();

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

      <section className="progress-overview">
        <div className="progress-overview-main">
          <span className="card-label">CURRENT TRAINING</span>
          <h2>OWASP Juice Shop</h2>
          <p>
            Continue your current security training path and complete the
            remaining practical missions.
          </p>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: "72%" }} />
          </div>

          <div className="progress-meta">
            <span>Lab progress</span>
            <strong>72%</strong>
          </div>
        </div>

        <div className="progress-overview-status">
          <CheckCircle2 size={20} />
          <span>IN PROGRESS</span>
        </div>
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

          <div className="skill-row">
            <div className="skill-info">
              <strong>Web Security</strong>
              <span>Developing</span>
            </div>

            <div className="skill-bar">
              <div style={{ width: "68%" }} />
            </div>

            <strong className="skill-value">68%</strong>
          </div>

          <div className="skill-row">
            <div className="skill-info">
              <strong>Reconnaissance</strong>
              <span>Developing</span>
            </div>

            <div className="skill-bar">
              <div style={{ width: "54%" }} />
            </div>

            <strong className="skill-value">54%</strong>
          </div>

          <div className="skill-row">
            <div className="skill-info">
              <strong>Authentication</strong>
              <span>Developing</span>
            </div>

            <div className="skill-bar">
              <div style={{ width: "42%" }} />
            </div>

            <strong className="skill-value">42%</strong>
          </div>
        </section>

        <section className="progress-panel">
          <div className="panel-heading">
            <div>
              <span className="card-label">ACTIVITY</span>
              <h2>Completed Training</h2>
            </div>
            <Trophy size={20} />
          </div>

          <div className="activity-row">
            <div className="activity-icon">
              <BookOpen size={17} />
            </div>
            <div>
              <strong>Security Fundamentals</strong>
              <span>Learning module completed</span>
            </div>
            <CheckCircle2 size={17} />
          </div>

          <div className="activity-row">
            <div className="activity-icon">
              <Target size={17} />
            </div>
            <div>
              <strong>Web Security Basics</strong>
              <span>Learning module completed</span>
            </div>
            <CheckCircle2 size={17} />
          </div>
        </section>
      </div>

      <section className="progress-next">
        <div>
          <span className="card-label">NEXT RECOMMENDATION</span>
          <h2>Continue Web Security Practice</h2>
          <p>
            Return to your active lab and complete the next practical mission.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => navigate("/labs/juice-shop/practice")}
        >
          Continue Practice
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}

export default Progress;
