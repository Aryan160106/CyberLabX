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

// ---- Labs (still unauthenticated on the backend until Sprint 8.6) ----
export const fetchLabs = async () => (await request<{ labs: BackendLab[] }>("/labs")).labs;

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
