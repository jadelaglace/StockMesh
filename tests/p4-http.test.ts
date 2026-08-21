import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server/app.js";
import { createWorkbenchRuntime, type WorkbenchRuntime } from "../src/workbench/runtime.js";

let app: FastifyInstance | undefined;
let runtime: WorkbenchRuntime | undefined;
afterEach(async () => {
  if (app) await app.close();
  runtime?.close();
  app = undefined;
  runtime = undefined;
});

describe("P4 HTTP boundary", () => {
  it("serves a safe snapshot and named commands", async () => {
    runtime = createWorkbenchRuntime(":memory:");
    app = await createServer(runtime, { serveWeb: false });
    const snapshot = await app.inject({ method: "GET", url: "/api/workbench" });
    expect(snapshot.statusCode).toBe(200);
    expect(snapshot.json().trace.evidence[0]).not.toHaveProperty("payload");
    expect(snapshot.json().trace.evidence[0]).not.toHaveProperty("locator");

    const staged = await app.inject({ method: "POST", url: "/api/evidence/stage", payload: { text: "Synthetic HTTP note", observedAt: "2026-08-17T10:22:00Z" } });
    expect(staged.statusCode).toBe(200);
    const stageId = staged.json().stageId as string;
    const reviewed = await app.inject({ method: "POST", url: `/api/evidence/${stageId}/review`, payload: { decision: "accept" } });
    expect(reviewed.statusCode).toBe(200);
    expect(reviewed.json().snapshot.staging.find((item: { id: string }) => item.id === stageId).status).toBe("accepted");

    const selectedPositionId = reviewed.json().snapshot.selectedPositionId as string;
    const analyzed = await app.inject({ method: "POST", url: "/api/analysis/run", payload: { positionId: selectedPositionId } });
    expect(analyzed.statusCode).toBe(200);
    expect(analyzed.json().snapshot.branches.length).toBe(6);
    const forecastId = analyzed.json().snapshot.branches.find((item: { purpose: string }) => item.purpose === "forecast").id as string;
    const replayed = await app.inject({ method: "POST", url: `/api/variations/${forecastId}/replay`, payload: {} });
    expect(replayed.statusCode).toBe(200);
    expect(replayed.json().snapshot.selectedPositionId).toBe(replayed.json().snapshot.branches.find((item: { id: string }) => item.id === forecastId).positionId);
  });

  it("rejects malformed commands without exposing internals", async () => {
    runtime = createWorkbenchRuntime(":memory:");
    app = await createServer(runtime, { serveWeb: false });
    const response = await app.inject({ method: "POST", url: "/api/evidence/stage", payload: { text: "" } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "workbench-command-rejected", message: "text is required" });
    expect(response.body).not.toContain("sqlite");

    const missingAnalysisPosition = await app.inject({ method: "POST", url: "/api/analysis/run", payload: {} });
    expect(missingAnalysisPosition.statusCode).toBe(400);
    expect(missingAnalysisPosition.json()).toEqual({ error: "workbench-command-rejected", message: "positionId is required" });

    const missingPosition = await app.inject({ method: "GET", url: "/api/workbench?positionId=missing" });
    expect(missingPosition.statusCode).toBe(400);
    expect(missingPosition.json()).toEqual({ error: "workbench-command-rejected", message: "Position not found: missing" });
  });

  it("does not expose unexpected persistence errors", async () => {
    runtime = createWorkbenchRuntime(":memory:");
    runtime.service.stageEvidence = () => { throw new Error("SQLITE_CONSTRAINT at private_table"); };
    app = await createServer(runtime, { serveWeb: false });
    const response = await app.inject({ method: "POST", url: "/api/evidence/stage", payload: { text: "Synthetic note", observedAt: "2026-08-17T10:22:00Z" } });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: "workbench-command-failed", message: "The command could not be completed." });
    expect(response.body).not.toContain("SQLITE");
    expect(response.body).not.toContain("private_table");
  });
});
