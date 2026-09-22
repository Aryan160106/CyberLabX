import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth";
import AppLayout from "./components/AppLayout";
import AuthPage from "./pages/AuthPage";
import ComingSoon from "./pages/ComingSoon";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/labs" element={<ComingSoon title="Labs" sprint="Sprint 8.6" />} />
          <Route path="/learning" element={<ComingSoon title="Learning" sprint="Sprint 9" />} />
          <Route path="/missions" element={<ComingSoon title="Missions" sprint="Sprint 10" />} />
          <Route path="/leaderboard" element={<ComingSoon title="Leaderboard" sprint="Sprint 11" />} />
          <Route path="/progress" element={<ComingSoon title="Progress" sprint="Sprint 11" />} />
          <Route path="/profile" element={<ComingSoon title="Profile" sprint="Sprint 11" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
