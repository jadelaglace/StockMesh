import { describe, expect, it } from "vitest";
import { SqliteStore } from "../src/persistence/database.js";
import { SCHEMA_VERSION } from "../src/persistence/schema.js";

describe("P1 persistence boundary", () => {
  it("creates the versioned schema and starts empty", () => {
    const store = new SqliteStore(":memory:");
    expect((store.db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get() as { version: number }).version).toBe(SCHEMA_VERSION);
    expect((store.db.prepare("SELECT COUNT(*) AS count FROM change_journal").get() as { count: number }).count).toBe(0);
    store.close();
  });
});
