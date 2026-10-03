import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { labs } from "../data/labData";
import { quizData } from "../data/quizData";

function Quiz() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();

  const lab = labs.find((item) => item.id === labId);
  const questions = labId ? quizData[labId] : undefined;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);

  if (!lab || !questions) {
    return (
      <div className="quiz-page">
        <span className="eyebrow">QUIZ ERROR</span>
        <h1>Quiz not available</h1>

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

  const question = questions[currentQuestion];

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    if (selectedAnswer === question.correctAnswer) {
      setScore((value) => value + 1);
    }

    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentQuestion === questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentQuestion((value) => value + 1);
    setSelectedAnswer(null);
    setSubmitted(false);
  };

  if (finished) {
    const finalScore = score;
    const percentage = Math.round((finalScore / questions.length) * 100);

    return (
      <div className="quiz-page">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate(`/labs/${lab.id}/learning`)}
        >
          <ArrowLeft size={15} />
          Back to Learning
        </button>

        <div className="quiz-result">
          <div className="quiz-result-icon">
            <ShieldCheck size={30} />
          </div>

          <span className="eyebrow">KNOWLEDGE CHECK COMPLETE</span>

          <h1>{percentage}%</h1>

          <p>
            You answered {finalScore} of {questions.length} questions
            correctly.
          </p>

          <button
            className="primary-button"
            type="button"
            onClick={() => navigate(`/labs/${lab.id}/practice`)}
          >
            Continue to Lab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <button
        className="back-button"
        type="button"
        onClick={() => navigate(`/labs/${lab.id}/learning`)}
      >
        <ArrowLeft size={15} />
        Back to Learning
      </button>

      <header className="quiz-header">
        <div>
          <span className="eyebrow">{lab.category}</span>
          <h1>{lab.name} Knowledge Check</h1>
          <p>
            Check your understanding before entering the practice environment.
          </p>
        </div>

        <div className="quiz-counter">
          <span>QUESTION</span>
          <strong>
            {String(currentQuestion + 1).padStart(2, "0")} /{" "}
            {String(questions.length).padStart(2, "0")}
          </strong>
        </div>
      </header>

      <div className="quiz-layout">
        <main className="quiz-card">
          <span className="card-label">
            QUESTION {String(currentQuestion + 1).padStart(2, "0")}
          </span>

          <h2>{question.question}</h2>

          <div className="quiz-options">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;

              let className = "quiz-option";

              if (isSelected) {
                className += " selected";
              }

              if (submitted && isCorrect) {
                className += " correct";
              }

              if (
                submitted &&
                isSelected &&
                index !== question.correctAnswer
              ) {
                className += " incorrect";
              }

              return (
                <button
                  key={option}
                  className={className}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelectedAnswer(index)}
                >
                  <span className="option-number">
                    {String.fromCharCode(65 + index)}
                  </span>

                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {submitted && (
            <div
              className={`quiz-feedback ${
                selectedAnswer === question.correctAnswer
                  ? "feedback-correct"
                  : "feedback-incorrect"
              }`}
            >
              {selectedAnswer === question.correctAnswer ? (
                <CheckCircle2 size={17} />
              ) : (
                <CircleAlert size={17} />
              )}

              <div>
                <strong>
                  {selectedAnswer === question.correctAnswer
                    ? "Correct"
                    : "Incorrect"}
                </strong>

                <p>{question.explanation}</p>
              </div>
            </div>
          )}

          <div className="quiz-actions">
            {!submitted ? (
              <button
                className="primary-button"
                type="button"
                disabled={selectedAnswer === null}
                onClick={handleSubmit}
              >
                Submit Answer
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                onClick={handleNext}
              >
                {currentQuestion === questions.length - 1
                  ? "View Result"
                  : "Next Question"}
              </button>
            )}
          </div>
        </main>

        <aside className="quiz-sidebar">
          <span className="card-label">PROGRESS</span>

          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill"
              style={{
                width: `${
                  ((currentQuestion + (submitted ? 1 : 0)) /
                    questions.length) *
                  100
                }%`,
              }}
            />
          </div>

          <div className="quiz-progress-text">
            <strong>{score}</strong>
            <span>correct so far</span>
          </div>

          <div className="quiz-rule">
            <span className="status-dot" />
            Complete the knowledge check before practice.
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Quiz;