import { Clock3, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

type LabCardProps = {
  id: string;
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  duration: string;
  status: "Available" | "Coming Soon";
};

function LabCard({
  id,
  name,
  description,
  difficulty,
  category,
  duration,
  status,
}: LabCardProps) {
  const navigate = useNavigate();

  const handleOpenLab = () => {
    if (status === "Available") {
      navigate(`/labs/${id}`);
    }
  };

  return (
    <article className="lab-card">
      <div className="lab-card-top">
        <div className="lab-icon">
          <ShieldCheck size={20} />
        </div>

        <span
          className={`lab-status ${
            status === "Available" ? "available" : ""
          }`}
        >
          {status}
        </span>
      </div>

      <div className="lab-card-content">
        <span className="lab-category">{category}</span>

        <h3>{name}</h3>

        <p>{description}</p>

        <div className="lab-meta">
          <span>{difficulty}</span>

          <span>
            <Clock3 size={13} />
            {duration}
          </span>
        </div>
      </div>

      <button
        className="lab-action"
        disabled={status === "Coming Soon"}
        onClick={handleOpenLab}
      >
        {status === "Available" ? "View Lab" : "Unavailable"}
      </button>
    </article>
  );
}

export default LabCard;