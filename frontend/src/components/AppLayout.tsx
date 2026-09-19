import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  BookOpen,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { useAuth } from "../auth";
import { Logo } from "./Logo";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/labs", label: "Labs", icon: FlaskConical },
  { to: "/learning", label: "Learning", icon: BookOpen },
  { to: "/missions", label: "Missions", icon: Target },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/progress", label: "Progress", icon: Activity },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="border-b border-line bg-surface md:w-56 md:shrink-0 md:border-b-0 md:border-r flex flex-col">
        <div className="p-4">
          <Logo />
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto px-2 pb-2 md:flex-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "text-dim hover:bg-card hover:text-ink"
                }`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center justify-between gap-2 border-t border-line p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.display_name}</p>
            <p className="font-mono text-xs text-dim">{user?.xp.toLocaleString()} XP</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="rounded-md p-2 text-dim hover:bg-card hover:text-danger"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8">
        <div className="mb-4 flex justify-end md:hidden">
          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs text-dim hover:text-danger"
          >
            <LogOut className="size-3.5" /> Log out
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}