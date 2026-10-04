import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import {
  ApiError,
  changePassword,
  deleteAccount,
  updateProfile,
} from "../api";

const inputStyle = {
  width: "100%",
  maxWidth: 360,
  padding: "10px 12px",
  background: "transparent",
  color: "inherit",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 4,
  font: "inherit",
} as const;

const fieldStyle = { display: "grid", gap: 6, marginBottom: 14 } as const;

function errorText(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback;
}

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.display_name ?? "");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const [deletePw, setDeletePw] = useState("");
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveProfile = async () => {
    setBusy(true);
    setProfileMsg(null);
    try {
      await updateProfile(name.trim());
      window.location.reload(); // simplest way to refresh the name everywhere
    } catch (e) {
      setProfileMsg(errorText(e, "Could not update profile"));
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setBusy(true);
    setPwMsg(null);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw("");
      setNewPw("");
      setPwMsg("Password changed.");
    } catch (e) {
      setPwMsg(errorText(e, "Could not change password"));
    } finally {
      setBusy(false);
    }
  };

  const removeAccount = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    setBusy(true);
    setDeleteMsg(null);
    try {
      await deleteAccount(deletePw);
      logout();
      navigate("/");
    } catch (e) {
      setDeleteMsg(errorText(e, "Could not delete account"));
      setBusy(false);
    }
  };

  return (
    <div className="progress-page">
      <div className="progress-header">
        <div>
          <span className="eyebrow">SYSTEM CONFIGURATION</span>
          <h1>Settings</h1>
          <p>Manage your account, get help, and review the platform terms.</p>
        </div>
      </div>

      <section className="progress-panel">
        <span className="card-label">PROFILE</span>
        <h2>Account details</h2>

        <div style={fieldStyle}>
          <label htmlFor="email">Email</label>
          <input id="email" style={{ ...inputStyle, opacity: 0.6 }} value={user?.email ?? ""} disabled />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="name">Display name</label>
          <input id="name" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <button
          className="primary-button"
          type="button"
          disabled={busy || name.trim().length < 2 || name.trim() === user?.display_name}
          onClick={saveProfile}
        >
          Save name
        </button>
        {profileMsg && <p role="status">{profileMsg}</p>}
      </section>

      <section className="progress-panel">
        <span className="card-label">SECURITY</span>
        <h2>Change password</h2>

        <div style={fieldStyle}>
          <label htmlFor="cur">Current password</label>
          <input id="cur" type="password" style={inputStyle} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="new">New password (8+ characters)</label>
          <input id="new" type="password" style={inputStyle} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        </div>

        <button
          className="primary-button"
          type="button"
          disabled={busy || !currentPw || newPw.length < 8}
          onClick={savePassword}
        >
          Change password
        </button>
        {pwMsg && <p role="status">{pwMsg}</p>}
      </section>

      <section className="progress-panel">
        <span className="card-label">SUPPORT</span>
        <h2>Help Center</h2>

        <details>
          <summary>How do labs work?</summary>
          <p>
            Each lab is a private, disposable environment started just for you.
            You can run one lab at a time, and it is removed automatically when
            its timer ends or when you end it.
          </p>
        </details>
        <details>
          <summary>Why did my lab disappear?</summary>
          <p>
            Labs expire after a fixed time. Launch a new one from the Practice
            page; quiz results and earned XP are kept.
          </p>
        </details>
        <details>
          <summary>How is XP earned?</summary>
          <p>
            You earn XP for each quiz question answered correctly on your first
            attempt, and for capturing a lab&apos;s mission flag. Each is awarded
            once.
          </p>
        </details>
        <details>
          <summary>Where do I find the flag?</summary>
          <p>
            Solve the mission inside your lab. The lab shows a flag code when
            the challenge is completed; paste it into Mission Flag.
          </p>
        </details>
        <p>
          Still stuck? Email{" "}
          <a href="mailto:support@cyberlabx.example">support@cyberlabx.example</a>.
        </p>
      </section>

      <section className="progress-panel">
        <span className="card-label">LEGAL</span>
        <h2>Terms &amp; Conditions</h2>

        <details>
          <summary>Read the terms</summary>
          <p><strong>1. Purpose.</strong> CyberLabX provides isolated environments for learning cybersecurity.</p>
          <p><strong>2. Acceptable use.</strong> Lab targets may only be attacked inside the platform. You must not use these techniques against any system you do not own or have written permission to test.</p>
          <p><strong>3. Accounts.</strong> You are responsible for your credentials and for activity under your account.</p>
          <p><strong>4. Data.</strong> We store your email, display name, quiz results and progress to run the platform. Deleting your account removes this data.</p>
          <p><strong>5. Availability.</strong> Labs are provided as-is for educational use and may be reset or removed at any time.</p>
          <p><em>Draft terms for an academic project; not legal advice.</em></p>
        </details>
      </section>

      <section className="progress-panel">
        <span className="card-label">DANGER ZONE</span>
        <h2>Delete account</h2>
        <p>
          This permanently removes your account, quiz answers and progress, and
          shuts down any lab you have running.
        </p>

        <div style={fieldStyle}>
          <label htmlFor="del">Confirm with your password</label>
          <input id="del" type="password" style={inputStyle} value={deletePw} onChange={(e) => setDeletePw(e.target.value)} />
        </div>

        <button
          className="hint-button"
          type="button"
          style={{ width: "auto", padding: "0 16px", borderColor: "#e5484d", color: "#e5484d" }}
          disabled={busy || !deletePw}
          onClick={removeAccount}
        >
          Delete my account
        </button>
        {deleteMsg && <p role="alert">{deleteMsg}</p>}
      </section>
    </div>
  );
}

export default Settings;