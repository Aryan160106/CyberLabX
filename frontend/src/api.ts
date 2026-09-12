// ─── API client for the CyberLabX FastAPI backend ─────────────────────────────
const API_BASE = "http://127.0.0.1:8000";

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

export async function fetchLabs(): Promise<BackendLab[]> {
  const res = await fetch(`${API_BASE}/labs`);
  if (!res.ok) throw new Error(`Failed to fetch labs: ${res.status}`);
  const data = await res.json();
  return data.labs;
}

export async function deployLab(labType: string): Promise<DeployResponse> {
  const res = await fetch(`${API_BASE}/labs/${labType}`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Deploy failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteLab(namespace: string): Promise<DeleteResponse> {
  const res = await fetch(`${API_BASE}/labs/${namespace}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Delete failed: ${res.status}`);
  }
  return res.json();
}