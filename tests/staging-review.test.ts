import { describe, expect, it } from "vitest";
import { StockMeshApp } from "../src/application/stockmesh-app.js";
import { SqliteStore } from "../src/persistence/database.js";

describe("P1 staging and review", () => {
  it("keeps rejected evidence out of canonical storage and accepts reviewed evidence", () => {
    const store = new SqliteStore(":memory:");
    const app = new StockMeshApp(store);
    const evidence = {
      id: "evidence-test-1",
      source_kind: "synthetic-text",
      content_identity: "test-content-1",
      authority: "test",
      acquired_at: "2026-08-18T00:00:00Z",
      integrity: "test",
      sensitivity: "public-synthetic",
      locator: null,
    };
    app.stageEvidence({ id: "stage-test-1", contentIdentity: evidence.content_identity, authority: evidence.authority, payload: evidence });
    app.reviewEvidence("stage-test-1", "reject", "reviewer", "insufficient provenance");
    expect(app.count("evidence_items")).toBe(0);

    app.stageEvidence({ id: "stage-test-2", contentIdentity: "test-content-2", authority: "test", payload: { ...evidence, id: "evidence-test-2", content_identity: "test-content-2" } });
    app.reviewEvidence("stage-test-2", "accept", "reviewer", "synthetic evidence accepted");
    expect(app.count("evidence_items")).toBe(1);
    store.close();
  });
});
