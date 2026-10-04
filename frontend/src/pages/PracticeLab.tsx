import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleHelp,
  ExternalLink,
  Flag,
  LockKeyhole,
  Power,
  Target,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { labs } from "../data/labData";
import { ApiError, deleteLab, deployLab, fetchMyLab, submitFlag } from "../api";
import { useAuth } from "../auth";
import type { MyLab } from "../api";

function formatRemaining(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function PracticeLab() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const { setXp } = useAuth();

  const lab = labs.find((item) => item.id === labId);

  const [myLab, setMyLab] = useState<MyLab | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [flagInput, setFlagInput] = useState("");
  const [flagBusy, setFlagBusy] = useState(false);
  const [flagMsg, setFlagMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMyLab(await fetchMyLab());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = myLab?.active ? myLab : null;
  const isThisLab = !!active && active.lab_type === lab?.id;
  const isReady = isThisLab && active?.ready === true;

  // Poll: fast while the pod is starting, slow once ready
  useEffect(() => {
    if (!active) return;
    const id = setInterval(refresh, isReady ? 30000 : 4000);
    return () => clearInterval(id);
  }, [active?.namespace, isReady, refresh]);

  // Countdown tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining =
    active?.expires_at ? Date.parse(active.expires_at) - now : null;

  // When the countdown hits zero, re-check (backend marks the session ended)
  useEffect(() => {
    if (active && remaining !== null && remaining <= 0) refresh();
  }, [active, remaining, refresh]);

  const handleSubmitFlag = async () => {
    setFlagBusy(true);
    setFlagMsg(null);
    try {
      const res = await submitFlag(flagInput.trim());
      if (res.correct) {
        setXp(res.xp);
        setFlagInput("");
        setFlagMsg(
          res.xp_awarded > 0
            ? `Correct! +${res.xp_awarded} XP`
            : "Correct. XP for this mission was already awarded.",
        );
      } else {
        setFlagMsg("Incorrect flag. Solve the challenge in your lab and copy the flag code it shows.");
      }
    } catch (e) {
      setFlagMsg(e instanceof ApiError ? e.message : "Could not check the flag");
    } finally {
      setFlagBusy(false);
    }
  };

  const handleLaunch = async () => {
    if (!lab) return;
    setBusy(true);
    setError(null);
    try {
      await deployLab(lab.id);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Launch failed");
    } finally {
      setBusy(false);
    }
  };

  const handleEnd = async () => {
    if (!active?.namespace) return;
    setBusy(true);
    setError(null);
    try {
      await deleteLab(active.namespace);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not end lab");
    } finally {
      setBusy(false);
    }
  };

  if (!lab) {
    return (
      <div className="practice-page">
        <span className="eyebrow">LAB ERROR</span>

        <h1>Lab not found</h1>

        <p>The requested practice environment does not exist.</p>

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

  const statusLabel = busy
    ? "DEPLOYING"
    : !active
      ? "NO LAB"
      : !isThisLab
        ? "OTHER LAB ACTIVE"
        : isReady
          ? "LAB READY"
          : "STARTING";

  return (
    <div className="practice-page">
      <button
        className="back-button"
        type="button"
        onClick={() => navigate(`/labs/${lab.id}/learning`)}
      >
        <ArrowLeft size={15} />
        Back to Learning
      </button>

      <header className="practice-header">
        <div>
          <span className="eyebrow">PRACTICE ENVIRONMENT</span>

          <h1>{lab.name}</h1>

          <p>
            Investigate the target, complete the mission, and submit your
            findings for evaluation.
          </p>
        </div>

        <div className="practice-status">
          <span className="status-dot" />
          {statusLabel}
        </div>
      </header>

      <div className="practice-workspace">
        <aside className="mission-panel">
          <div className="mission-section">
            <span className="card-label">CURRENT MISSION</span>

            <h2>Identify the vulnerable functionality</h2>

            <p>
              Investigate the application and identify a security weakness
              related to the current mission.
            </p>
          </div>

          <div className="mission-section">
            <span className="card-label">OBJECTIVES</span>

            <div className="mission-objective active">
              <span>01</span>
              <div>
                <strong>Reconnaissance</strong>
                <small>Understand the application</small>
              </div>
            </div>

            <div className="mission-objective">
              <span>02</span>
              <div>
                <strong>Identify weakness</strong>
                <small>Find the vulnerable behaviour</small>
              </div>
            </div>

            <div className="mission-objective">
              <span>03</span>
              <div>
                <strong>Submit evidence</strong>
                <small>Provide the required flag</small>
              </div>
            </div>
          </div>

          <div className="mission-section">
            <div className="mission-section-heading">
              <span className="card-label">HINTS</span>

              <CircleHelp size={15} />
            </div>

            <button className="hint-button" type="button">
              Reveal Hint 01
            </button>
          </div>

          <div className="flag-section">
            <span className="card-label">MISSION FLAG</span>
            {flagMsg && <p role="status">{flagMsg}</p>}

            <div className="flag-input">
              <Flag size={15} />

              <input
                type="text"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="Enter flag..."
                aria-label="Mission flag"
              />
            </div>

            <button className="primary-button flag-submit" type="button" disabled={!isThisLab || !flagInput.trim() || flagBusy} onClick={handleSubmitFlag}>
              Submit Flag
            </button>
          </div>
        </aside>

        <main className="lab-environment">
          <div className="environment-toolbar">
            <div>
              <span className="card-label">LIVE ENVIRONMENT</span>

              <strong>{lab.name}</strong>
            </div>

            <div className="environment-status">
              <span className="status-dot" />
              {isThisLab && remaining !== null
                ? `${statusLabel} · ${formatRemaining(remaining)} left`
                : statusLabel}
            </div>
          </div>

          <div className="environment-frame">
            <div className="environment-placeholder">
              <div className="environment-icon">
                <Target size={28} />
              </div>

              <span className="eyebrow">LAB ENVIRONMENT</span>

              {loading ? (
                <>
                  <h2>Checking lab status...</h2>
                </>
              ) : !active ? (
                <>
                  <h2>No active lab</h2>
                  <p>
                    Launch a private {lab.name} environment. It is isolated to
                    your account and expires automatically.
                  </p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleLaunch}
                    disabled={busy}
                  >
                    {busy ? "Deploying..." : "Launch Lab"}
                  </button>
                </>
              ) : !isThisLab ? (
                <>
                  <h2>Another lab is running</h2>
                  <p>
                    You can run one lab at a time. End your active lab
                    ({active.lab_type}) to launch {lab.name}.
                  </p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleEnd}
                    disabled={busy}
                  >
                    <Power size={14} />
                    {busy ? "Ending..." : "End Active Lab"}
                  </button>
                </>
              ) : (
                <>
                  <h2>{isReady ? "Practice environment ready" : "Starting your lab..."}</h2>
                  <p>
                    {isReady
                      ? "Your private lab is running. It opens in a new tab."
                      : "The pod is starting. This usually takes under a minute."}
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={!isReady}
                      onClick={() =>
                        window.open(active.lab_url, "_blank", "noopener,noreferrer")
                      }
                    >
                      <ExternalLink size={14} />
                      Open Lab
                    </button>
                    <button
                      className="hint-button"
                      type="button"
                      onClick={handleEnd}
                      disabled={busy}
                      style={{ width: "auto", padding: "0 16px" }}
                    >
                      <Power size={14} />
                      {busy ? "Ending..." : "End Lab"}
                    </button>
                  </div>
                </>
              )}

              {error && <p role="alert">{error}</p>}

              <div className="environment-info">
                <div>
                  <span>APPLICATION</span>
                  <strong>{lab.name}</strong>
                </div>

                <div>
                  <span>STATUS</span>
                  <strong>{statusLabel}</strong>
                </div>

                <div>
                  <span>ISOLATION</span>
                  <strong>
                    <LockKeyhole size={13} />
                    Active
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PracticeLab;
