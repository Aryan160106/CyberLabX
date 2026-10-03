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

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
          Training path active
        </div>
      </section>

      <section className="dashboard-feature">
        <div className="dashboard-feature-main">
          <div className="dashboard-feature-icon">
            <FlaskConical size={20} />
          </div>

          <div>
            <span className="card-label">CURRENT LAB</span>

            <h2>OWASP Juice Shop</h2>

            <p>
              Practice identifying common web application vulnerabilities in a
              controlled environment.
            </p>
          </div>
        </div>

        <div className="dashboard-feature-progress">
          <div className="dashboard-progress-header">
            <span>LAB PROGRESS</span>
            <strong>72%</strong>
          </div>

          <div className="dashboard-progress-track">
            <div className="dashboard-progress-value" />
          </div>

          <div className="dashboard-progress-meta">
            <span>3 of 4 learning stages complete</span>

            <button
              className="dashboard-link"
              type="button"
              onClick={() => navigate("/labs/juice-shop")}
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
        <div className="dashboard-path-step completed">
          <div className="dashboard-path-icon">
            <CheckCircle2 size={17} />
          </div>

          <div>
            <span>01</span>
            <strong>Learn</strong>
            <small>Concept completed</small>
          </div>
        </div>

        <div className="dashboard-path-line completed" />

        <div className="dashboard-path-step completed">
          <div className="dashboard-path-icon">
            <CheckCircle2 size={17} />
          </div>

          <div>
            <span>02</span>
            <strong>Quiz</strong>
            <small>Knowledge checked</small>
          </div>
        </div>

        <div className="dashboard-path-line completed" />

        <div className="dashboard-path-step active">
          <div className="dashboard-path-icon">
            <Target size={17} />
          </div>

          <div>
            <span>03</span>
            <strong>Practice</strong>
            <small>Current stage</small>
          </div>
        </div>

        <div className="dashboard-path-line" />

        <div className="dashboard-path-step">
          <div className="dashboard-path-icon">
            <ShieldCheck size={17} />
          </div>

          <div>
            <span>04</span>
            <strong>Evaluate</strong>
            <small>Complete the mission</small>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <span className="card-label">SKILL DEVELOPMENT</span>
              <h3>Security skills</h3>
            </div>

            <ShieldCheck size={18} />
          </div>

          <div className="skill-row">
            <div className="skill-info">
              <span>Web Security</span>
              <strong>72%</strong>
            </div>

            <div className="skill-track">
              <div className="skill-value web-security" />
            </div>
          </div>

          <div className="skill-row">
            <div className="skill-info">
              <span>Network Security</span>
              <strong>38%</strong>
            </div>

            <div className="skill-track">
              <div className="skill-value network-security" />
            </div>
          </div>

          <div className="skill-row">
            <div className="skill-info">
              <span>Linux Security</span>
              <strong>24%</strong>
            </div>

            <div className="skill-track">
              <div className="skill-value linux-security" />
            </div>
          </div>
        </article>

        <article className="dashboard-panel dashboard-next">
          <span className="card-label">RECOMMENDED NEXT</span>

          <div className="dashboard-next-icon">
            <BookOpen size={18} />
          </div>

          <h3>Network reconnaissance</h3>

          <p>
            Learn how security analysts identify hosts, services, and exposed
            attack surfaces.
          </p>

          <button
            className="dashboard-link"
            type="button"
            onClick={() => navigate("/labs")}
          >
            Explore Labs
            <ArrowRight size={14} />
          </button>
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
          <div className="activity-item">
            <div className="activity-icon">
              <CheckCircle2 size={16} />
            </div>

            <div>
              <strong>Knowledge check completed</strong>
              <span>OWASP Juice Shop</span>
            </div>

            <time>Today</time>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Target size={16} />
            </div>

            <div>
              <strong>Practice environment unlocked</strong>
              <span>OWASP Juice Shop</span>
            </div>

            <time>Today</time>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Clock3 size={16} />
            </div>

            <div>
              <strong>Learning module reviewed</strong>
              <span>Web application vulnerabilities</span>
            </div>

            <time>Yesterday</time>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;