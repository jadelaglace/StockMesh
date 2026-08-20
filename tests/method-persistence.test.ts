import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { migrateDatabase } from "../src/persistence/schema.js";
import { createMethodFixture } from "./helpers.js";

describe("P2 Method persistence", () => {
  it("owns schema v2 and persists attributable definitions, runs, and results", () => {
    const { runner, app, store } = createMethodFixture();
    expect((store.db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get() as { version: number }).version).toBe(2);
    expect(app.count("method_definitions")).toBe(6);
    const run = runner.run({ positionId: "position-method-after", methodId: "sna.foundation" });
    expect(run.status).toBe("succeeded");
    expect(run.implementationIdentity).toContain("graphology@0.26.0");
    expect(app.count("method_runs")).toBe(1);
    expect(app.count("method_results")).toBe(1);
    store.close();
  });

  it("migrates an existing P1 schema ledger from v1 to v2", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    db.exec(`
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO schema_migrations (version, applied_at) VALUES (1, '2026-08-18T00:00:00Z');
      CREATE TABLE positions (id TEXT PRIMARY KEY);
    `);
    migrateDatabase(db);
    expect((db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get() as { version: number }).version).toBe(2);
    expect((db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name LIKE 'method_%'").get() as { count: number }).count).toBe(3);
    db.close();
  });
});
