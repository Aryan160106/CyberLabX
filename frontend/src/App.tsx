import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth";
import AppLayout from "./components/AppLayout";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import LabDetail from "./pages/LabDetail";
import Labs from "./pages/Labs";
import Landing from "./pages/Landing";
import Learning from "./pages/Learning";
import PracticeLab from "./pages/PracticeLab";
import Progress from "./pages/Progress";
import Quiz from "./pages/Quiz";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/labs/:labId" element={<LabDetail />} />
          <Route path="/labs/:labId/learning" element={<Learning />} />
          <Route path="/labs/:labId/quiz" element={<Quiz />} />
          <Route path="/labs/:labId/practice" element={<PracticeLab />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
