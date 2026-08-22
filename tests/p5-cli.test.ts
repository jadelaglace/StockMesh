import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function database(): string {
  const root = mkdtempSync(join(tmpdir(), "stockmesh-p5-"));
  roots.push(root);
  return join(root, "stockmesh.sqlite");
}

function cli(db: string, capability: string, input = "{}") {
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm.cmd", "run", "--silent", "stockmesh", "--", capability, "--input", input]
    : ["run", "--silent", "stockmesh", "--", capability, "--input", input];
  return spawnSync(command, args, {
    cwd: resolve(process.cwd()),
    env: { ...process.env, STOCKMESH_DB: db, NODE_ENV: "test" },
    encoding: "utf8",
  });
}

function output(result: ReturnType<typeof cli>): Record<string, unknown> {
  expect(result.status).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout.trim().split(/\r?\n/)).toHaveLength(1);
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

describe("P5 StockMesh CLI", () => {
  it("uses one JSON envelope and persists branch navigation across calls", () => {
    const db = database();
    const workbench = output(cli(db, "workbench.get"));
    expect(workbench).toMatchObject({ operation: "workbench.get", status: "succeeded", positionId: "position-syn-004", processor: { name: "stockmesh", version: "p5" } });

    const analysis = output(cli(db, "analysis.run", JSON.stringify({ positionId: "position-syn-004" })));
    const analysisResult = analysis.result as { runId: string; snapshot: { branches: Array<{ id: string; purpose: string }> } };
    const forecast = analysisResult.snapshot.branches.find((branch) => branch.purpose === "forecast")!;
    expect(output(cli(db, "branch.pin", JSON.stringify({ variationId: forecast.id, positionId: "position-syn-004" })))).toMatchObject({ operation: "branch.pin" });
    const replay = output(cli(db, "decision.replay", JSON.stringify({ variationId: forecast.id })));
    expect((replay.result as { snapshot: { selectedPositionId: string } }).snapshot.selectedPositionId).toBe(replay.positionId);
    expect(output(cli(db, "branch.fork", JSON.stringify({ variationId: forecast.id, positionId: "position-syn-004" })))).toMatchObject({ operation: "branch.fork" });
    expect(output(cli(db, "search.continue", JSON.stringify({ searchRunId: analysisResult.runId, positionId: "position-syn-004" })))).toMatchObject({ operation: "search.continue" });
    const listed = output(cli(db, "branch.list", JSON.stringify({ positionId: "position-syn-004" })));
    expect((listed.result as { branches: Array<{ id: string; state: string }> }).branches.find((branch) => branch.id === forecast.id)?.state).toBe("pinned");
  }, 20_000);

  it("offers staging only and fails closed with stable redacted diagnostics", () => {
    const db = database();
    const staged = output(cli(db, "evidence.stage", JSON.stringify({ text: "CLI synthetic note", observedAt: "2026-08-17T10:25:00Z" })));
    expect(staged).toMatchObject({ operation: "evidence.stage", status: "succeeded", result: { staging: { status: "staged" } } });

    const forbidden = cli(db, "evidence.accept");
    expect(forbidden.status).toBe(2);
    expect(forbidden.stdout).toBe("");
    expect(JSON.parse(forbidden.stderr)).toEqual({ status: "rejected", error: "unsupported capability: evidence.accept" });

    const malformed = cli(db, "analysis.run", "{");
    expect(malformed.status).toBe(2);
    expect(JSON.parse(malformed.stderr)).toEqual({ status: "rejected", error: "input must be valid JSON" });

    const missing = cli(db, "analysis.run");
    expect(missing.status).toBe(2);
    expect(JSON.parse(missing.stderr)).toEqual({ status: "rejected", error: "positionId is required" });

    const misnamed = cli(db, "context.get", JSON.stringify({ position_id: "position-syn-001" }));
    expect(misnamed.status).toBe(2);
    expect(misnamed.stdout).toBe("");
    expect(JSON.parse(misnamed.stderr)).toMatchObject({ status: "rejected", error: expect.stringContaining("unsupported input field") });

    const invalidTime = cli(db, "evidence.stage", JSON.stringify({ text: "synthetic", observedAt: "not-a-time" }));
    expect(invalidTime.status).toBe(2);
    expect(invalidTime.stdout).toBe("");
    expect(JSON.parse(invalidTime.stderr)).toEqual({ status: "rejected", error: "observedAt must be a valid timestamp" });

    const internalRoot = mkdtempSync(join(tmpdir(), "stockmesh-p5-dir-"));
    roots.push(internalRoot);
    const internal = cli(internalRoot, "workbench.get");
    expect(internal.status).toBe(1);
    expect(internal.stdout).toBe("");
    expect(JSON.parse(internal.stderr)).toEqual({ status: "rejected", error: "StockMesh capability failed" });
    expect(internal.stderr).not.toContain(internalRoot);
    expect(internal.stderr.toLowerCase()).not.toContain("sqlite");

    const oversized = cli(db, "x".repeat(5_000));
    expect(oversized.status).toBe(2);
    expect(oversized.stdout).toBe("");
    expect(Buffer.byteLength(oversized.stderr, "utf8")).toBeLessThanOrEqual(512);
    expect(JSON.parse(oversized.stderr)).toMatchObject({ status: "rejected", error: expect.stringMatching(/\.\.\.$/) });
  }, 20_000);
});
