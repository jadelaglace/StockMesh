import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { StockMeshApp } from "../src/application/stockmesh-app.js";
import { SqliteStore } from "../src/persistence/database.js";
import type { PositionInput, SyntheticFixture } from "../src/domain/types.js";
import { createBuiltinMethodRegistry, MethodRunner } from "../src/methods/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(here, "../contracts/v0.2/synthetic-organizational-learning-record.json");

export function loadFixture(): SyntheticFixture {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as SyntheticFixture;
}

export function createFixtureApp(): { store: SqliteStore; app: StockMeshApp; fixture: SyntheticFixture } {
  const store = new SqliteStore(":memory:");
  const app = new StockMeshApp(store);
  const fixture = loadFixture();
  app.importSyntheticFixture(fixture);
  return { store, app, fixture };
}

export function rootPosition(id: string, asOf: string): PositionInput {
  return {
    id,
    mode: "reconstructed",
    playgroundId: "playground-syn-orchard",
    asOf,
    evidenceCutoff: asOf === "2026-08-17T09:00:00Z" ? "2026-08-17T09:00:00Z" : "2026-08-17T09:11:00Z",
    profileSnapshotId: "profile-snapshot-syn-root",
    perspectiveId: "perspective-syn-analyst",
    question: "Which response best improves decision clarity without unnecessary escalation?",
  };
}

export function createMethodFixture(): ReturnType<typeof createFixtureApp> & { runner: MethodRunner } {
  const fixtureApp = createFixtureApp();
  fixtureApp.app.projectPosition(rootPosition("position-method-after", "2026-08-17T09:10:00Z"));
  const runner = new MethodRunner(fixtureApp.store, createBuiltinMethodRegistry());
  return { ...fixtureApp, runner };
}

export function projectDeltaPositions(app: StockMeshApp, afterPositionId = "position-method-delta-after"): void {
  app.projectPosition({
    ...rootPosition("position-method-before", "2026-08-17T09:10:00Z"),
    asOf: "2026-08-17T08:59:59Z",
  });
  app.projectPosition(rootPosition(afterPositionId, "2026-08-17T09:10:00Z"));
}
