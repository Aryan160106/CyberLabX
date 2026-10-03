import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Crosshair,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { labs } from "../data/labData";

function Learning() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();

  const lab = labs.find((item) => item.id === labId);

  if (!lab) {
    return (
      <div className="learning-page">
        <span className="eyebrow">LEARNING ERROR</span>
        <h1>Lab not found</h1>
        <p>The requested learning module does not exist.</p>

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
    <div className="learning-page">
      <button
  className="back-button"
  type="button"
  onClick={() => navigate(`/labs/${lab.id}`)}
>
  <ArrowLeft size={15} />
  Back to Lab
</button>

      <header className="learning-header">
        <span className="eyebrow">{lab.category}</span>

        <h1>{lab.name}</h1>

        <p>
          Build the knowledge required to identify and investigate the
          vulnerabilities inside this lab.
        </p>
      </header>

      <div className="learning-layout">
        <main className="learning-content">
          <section className="learning-section">
            <div className="learning-section-icon">
              <BookOpen size={19} />
            </div>

            <div>
              <span className="card-label">01 · CONCEPT</span>

              <h2>What are web application vulnerabilities?</h2>

              <p>
                Web applications can contain weaknesses that allow users to
                perform actions they were never supposed to perform. These
                weaknesses can affect authentication, authorization, input
                handling, data protection, and application logic.
              </p>

              <p>
                In this lab, you will work with a deliberately vulnerable
                application and learn how these weaknesses can be identified
                through practical investigation.
              </p>
            </div>
          </section>

          <section className="learning-section">
            <div className="learning-section-icon">
              <Crosshair size={19} />
            </div>

            <div>
              <span className="card-label">02 · IDENTIFY</span>

              <h2>What should you look for?</h2>

              <ul className="learning-list">
                {lab.vulnerabilities.map((vulnerability) => (
                  <li key={vulnerability}>
                    <CheckCircle2 size={15} />
                    <span>{vulnerability}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="learning-section">
            <div className="learning-section-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <span className="card-label">03 · INVESTIGATE</span>

              <h2>From theory to practice</h2>

              <p>
                Your goal is not simply to read about a vulnerability. You
                will investigate application behavior, identify the weakness,
                and apply what you learned inside the controlled lab
                environment.
              </p>
            </div>
          </section>
        </main>

        <aside className="learning-sidebar">
          <div className="learning-progress">
            <span className="card-label">LEARNING PATH</span>

            <div className="learning-step active">
              <span>01</span>
              <div>
                <strong>Understand</strong>
                <small>Learn the concept</small>
              </div>
            </div>

            <div className="learning-step">
              <span>02</span>
              <div>
                <strong>Identify</strong>
                <small>Recognize the weakness</small>
              </div>
            </div>

            <div className="learning-step">
              <span>03</span>
              <div>
                <strong>Quiz</strong>
                <small>Check your knowledge</small>
              </div>
            </div>

            <div className="learning-step">
              <span>04</span>
              <div>
                <strong>Practice</strong>
                <small>Enter the lab</small>
              </div>
            </div>
          </div>

          <div className="learning-next">
            <span className="card-label">NEXT</span>

            <h3>Ready for the knowledge check?</h3>

            <p>
              Complete the short quiz before entering the practice
              environment.
            </p>

            <button
  className="primary-button"
  type="button"
  onClick={() => navigate(`/labs/${lab.id}/quiz`)}
>
  Take Quick Quiz
</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Learning;