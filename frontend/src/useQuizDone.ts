import { useEffect, useState } from "react";
import { fetchProgress } from "./api";

// True once every quiz question for this lab has been answered
// (same rule the backend uses in /me/progress).
export function useQuizDone(labId?: string) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!labId) return;
    fetchProgress()
      .then((p) => {
        const lab = p.labs.find((l) => l.lab_id === labId);
        setDone(!!lab?.stages.find((s) => s.key === "quiz")?.done);
      })
      .catch(() => setDone(false));
  }, [labId]);
  return done;
}