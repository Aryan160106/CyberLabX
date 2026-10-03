import {
  BookOpen,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
  Trophy,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../auth";

import "../App.css";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  // Lab sub-pages (/labs/:id/...) have their own header, so hide the topbar.
  const hideTopbar = /^\/labs\/.+/.test(pathname);
  const initials = (user?.display_name ?? "ST").trim().slice(0, 2).toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CX</div>
          <div>
            <h1>CyberLabX</h1>
            <span>CYBER TRAINING PLATFORM</span>
          </div>
        </div>

        <nav className="navigation">
          <p className="nav-label">WORKSPACE</p>

          <NavLink to="/dashboard" className="nav-item">
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/labs" className="nav-item">
            <FlaskConical size={18} />
            Labs
          </NavLink>
          <NavLink to="/learning" className="nav-item">
            <BookOpen size={18} />
            Learning
          </NavLink>
          <NavLink to="/progress" className="nav-item">
            <Trophy size={18} />
            Progress
          </NavLink>

          <p className="nav-label system-label">SYSTEM</p>

          <NavLink to="/settings" className="nav-item">
            <SettingsIcon size={18} />
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <div>
            <strong>{user?.display_name}</strong>
            <span>{user?.xp.toLocaleString()} XP</span>
          </div>
          <button
            type="button"
            className="logout-button"
            title="Log out"
            onClick={logout}
          >
            <LogOut size={15} />
          </button>
        </div>

        <div className="sidebar-status">
          <span className="status-dot" /> Platform operational
        </div>
      </aside>

      <main className="main">
        {!hideTopbar && (
          <header className="topbar">
            <div>
              <span className="eyebrow">STUDENT CONSOLE</span>
              <h2>CyberLabX</h2>
            </div>

            <div className="topbar-right">
              <div className="system-status">
                <span className="status-dot" />
                Systems operational
              </div>

              <div className="profile">
                <div className="avatar">{initials}</div>
                <div>
                  <strong>{user?.display_name}</strong>
                  <span>{user?.xp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          </header>
        )}

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
