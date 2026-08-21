import type { OperationResult, StageEvidenceCommand, WorkbenchSnapshot } from "../../src/workbench/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json() as T & { message?: string };
  if (!response.ok) throw new Error(body.message ?? `Request failed (${response.status})`);
  return body;
}

export const api = {
  snapshot: (positionId?: string) => request<WorkbenchSnapshot>(`/api/workbench${positionId ? `?positionId=${encodeURIComponent(positionId)}` : ""}`),
  stage: (input: StageEvidenceCommand) => request<OperationResult & { stageId: string }>("/api/evidence/stage", { method: "POST", body: JSON.stringify(input) }),
  review: (stageId: string, decision: "accept" | "reject") => request<OperationResult>(`/api/evidence/${encodeURIComponent(stageId)}/review`, { method: "POST", body: JSON.stringify({ decision }) }),
  analyze: () => request<OperationResult>("/api/analysis/run", { method: "POST", body: "{}" }),
  pin: (id: string) => request<OperationResult>(`/api/variations/${encodeURIComponent(id)}/pin`, { method: "POST", body: "{}" }),
  replay: (id: string) => request<OperationResult>(`/api/variations/${encodeURIComponent(id)}/replay`, { method: "POST", body: "{}" }),
  fork: (id: string) => request<OperationResult>(`/api/variations/${encodeURIComponent(id)}/fork`, { method: "POST", body: "{}" }),
  resume: (id: string) => request<OperationResult>(`/api/search/${encodeURIComponent(id)}/resume`, { method: "POST", body: "{}" }),
  applyRevision: (id: string) => request<OperationResult>(`/api/profile-revisions/${encodeURIComponent(id)}/apply`, { method: "POST", body: "{}" }),
};
