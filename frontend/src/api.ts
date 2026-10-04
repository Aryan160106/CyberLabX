// API client for the CyberLabX FastAPI backend.
// Relative path: the Ingress routes /api on this same origin to the backend Service.
const API_BASE = "/api";
const TOKEN_KEY = "cyberlabx_token";
export const UNAUTHORIZED_EVENT = "cyberlabx:unauthorized";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let detail = `Request failed (${res.status})`;
    if (typeof err.detail === "string") detail = err.detail;
    else if (Array.isArray(err.detail) && err.detail[0]?.msg) detail = err.detail[0].msg;
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

// ---- Types ----
export interface User {
  id: string;
  email: string;
  display_name: string;
  xp: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface BackendLab {
  namespace: string;
  lab_type: string;
  created: string | null;
  pod_count: number;
  pod_statuses: string[];
  lab_url: string;
}

export interface DeployResponse {
  deployed: boolean;
  namespace: string;
  release: string;
  lab_url: string;
  helm_output: string;
}

export interface DeleteResponse {
  deleted: boolean;
  namespace: string;
  helm_uninstall_output: string;
  namespace_delete_error: string | null;
}

// ---- Auth ----
export const signup = (email: string, password: string, displayName: string) =>
  request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name: displayName }),
  });

export const login = (email: string, password: string) =>
  request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const fetchMe = () => request<User>("/auth/me");

// ---- Labs ----

export const deployLab = (labType: string) =>
  request<DeployResponse>(`/labs/${labType}`, { method: "POST" });

export const deleteLab = (namespace: string) =>
  request<DeleteResponse>(`/labs/${namespace}`, { method: "DELETE" });
// ---- Current user's own lab (Sprint 8.6) ----
export interface MyLab {
  active: boolean;
  lab_type?: string;
  namespace?: string;
  lab_url?: string;
  created_at?: string;
  expires_at?: string | null;
  ready?: boolean;
}

export const fetchMyLab = () => request<MyLab>("/labs/me");

// ---- Quiz (graded on the server) ----
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface AnswerResult {
  correct: boolean;
  correct_answer: number;
  explanation: string;
  xp_awarded: number;
  xp: number;
}

export const fetchQuiz = (labId: string) =>
  request<{ lab_id: string; questions: QuizQuestion[] }>(`/labs/${labId}/quiz`);

export const answerQuiz = (labId: string, questionId: string, selected: number) =>
  request<AnswerResult>(`/labs/${labId}/quiz/answer`, {
    method: "POST",
    body: JSON.stringify({ question_id: questionId, selected }),
  });

// ---- Mission flag ----
export interface FlagResult {
  correct: boolean;
  xp_awarded: number;
  xp: number;
}

export const submitFlag = (flag: string) =>
  request<FlagResult>("/labs/me/flag", {
    method: "POST",
    body: JSON.stringify({ flag }),
  });

// ---- Progress (real data for Dashboard / Progress) ----
export interface LabStage { key: string; label: string; done: boolean }
export interface LabProgress {
  lab_id: string;
  name: string;
  category: string;
  stages: LabStage[];
  progress: number;
  quiz: { answered: number; total: number; correct: number };
}
export interface ProgressData {
  xp: number;
  labs: LabProgress[];
  current: LabProgress | null;
  skills: { category: string; earned: number; max: number; percent: number }[];
  activity: { title: string; detail: string; at: string }[];
  recommended: { lab_id: string; name: string; reason: string } | null;
}
export const fetchProgress = () => request<ProgressData>("/me/progress");

// ---- Account ----
export const updateProfile = (displayName: string) =>
  request<{ display_name: string }>("/account/profile", {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<{ changed: boolean }>("/account/password", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });

export const deleteAccount = (password: string) =>
  request<{ deleted: boolean }>("/account/delete", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
