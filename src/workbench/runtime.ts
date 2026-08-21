import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { StockMeshApp } from "../application/stockmesh-app.js";
import { DeterministicAnalysisAdapter } from "../analysis/index.js";
import type { SyntheticFixture } from "../domain/types.js";
import { createBuiltinMethodRegistry, MethodRunner } from "../methods/index.js";
import { SqliteStore } from "../persistence/database.js";
import { PossibilityStore } from "../possibilities/index.js";
import { SearchCoordinator } from "../search/index.js";
import { WorkbenchService } from "./service.js";
import { syntheticWorkbenchProposal } from "./synthetic-analysis.js";

export interface WorkbenchRuntime {
  store: SqliteStore;
  service: WorkbenchService;
  close(): void;
}

export function createWorkbenchRuntime(filename = ":memory:", fixturePath = resolve(process.cwd(), "contracts/v0.2/synthetic-organizational-learning-record.json")): WorkbenchRuntime {
  const store = new SqliteStore(filename);
  const app = new StockMeshApp(store, "stockmesh-p4-workbench");
  if (app.count("playgrounds") === 0) {
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as SyntheticFixture;
    app.importSyntheticFixture(fixture);
  }
  const methods = new MethodRunner(store, createBuiltinMethodRegistry());
  const possibilities = new PossibilityStore(store);
  const analysis = new DeterministicAnalysisAdapter(syntheticWorkbenchProposal, "p4-workbench", { tokens: 24, cost: 0 });
  const search = new SearchCoordinator(store, possibilities, analysis);
  const service = new WorkbenchService(store, app, methods, possibilities, search);
  service.initialize();
  return { store, service, close: () => store.close() };
}
