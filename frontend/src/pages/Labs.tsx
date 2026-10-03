
import LabCard from "../components/LabCard";
import { labs } from "../data/labData";

function Labs() {
  return (
    <div className="labs-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PRACTICE ENVIRONMENTS</span>

          <h1>Security Labs</h1>

          <p>
            Choose a controlled environment and turn security concepts into
            practical skills.
          </p>
        </div>
      </div>
      
      <div className="labs-grid">
        {labs.map((lab) => (
          <LabCard
            key={lab.id}
            id={lab.id}
            name={lab.name}
            description={lab.description}
            difficulty={lab.difficulty}
            category={lab.category}
            duration={lab.duration}
            status={lab.status}
          />
        ))}
      </div>
    </div>
  );
}

export default Labs;