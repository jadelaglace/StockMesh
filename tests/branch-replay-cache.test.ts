import { describe, expect, it } from "vitest";
import { createP3Harness, startP3Search } from "./p3-helpers.js";

describe("P3 branch replay and cache", () => {
  it("pins, checks out, replays, forks, and reuses only exact cached analysis", async () => {
    const harness = createP3Harness();
    const budgets = { maxDepth: 1, maxMaterializedPositions: 3, maxAnalysisCalls: 5, maxTokens: 100 };
    const firstRun = startP3Search(harness, "cache-first", budgets);
    await harness.search.execute(firstRun.id);
    const forecast = harness.store.db.prepare("SELECT id FROM variations WHERE purpose = 'forecast' ORDER BY id LIMIT 1").get() as { id: string };
    const pinned = harness.possibilities.pin(forecast.id);
    const checkout = harness.possibilities.checkout(forecast.id);
    const replay = harness.possibilities.replay(forecast.id);
    expect(pinned.state).toBe("pinned");
    expect(checkout.position.mode).toBe("predicted");
    expect(replay.position.projectionIdentity).toBe(checkout.position.projectionIdentity);

    const callsBeforeCache = harness.adapter.calls;
    const cachedRun = startP3Search(harness, "cache-second", budgets);
    await harness.search.execute(cachedRun.id);
    expect(harness.adapter.calls).toBe(callsBeforeCache);

    const fork = harness.search.fork({
      runKey: "forked-run",
      variationId: forecast.id,
      budgets: { maxDepth: 1, maxMaterializedPositions: 1, maxAnalysisCalls: 2 },
    });
    await harness.search.execute(fork.id);
    const child = harness.store.db.prepare("SELECT parent_variation_id FROM variations WHERE parent_variation_id = ? LIMIT 1").get(forecast.id) as { parent_variation_id: string };
    expect(child.parent_variation_id).toBe(forecast.id);
    expect(harness.possibilities.checkout(forecast.id).variation.state).toBe("pinned");
    harness.store.close();
  });

  it("detects Transition and Trajectory replay drift", async () => {
    const harness = createP3Harness();
    const run = startP3Search(harness, "replay-drift", { maxDepth: 1, maxMaterializedPositions: 1, maxAnalysisCalls: 1 });
    await harness.search.execute(run.id);
    const variation = harness.store.db.prepare("SELECT id, trajectory_id FROM variations LIMIT 1").get() as { id: string; trajectory_id: string };
    harness.store.db.prepare("UPDATE trajectories SET trajectory_identity = 'tampered' WHERE id = ?").run(variation.trajectory_id);
    expect(() => harness.possibilities.replay(variation.id)).toThrow("Trajectory replay mismatch");
    harness.store.close();
  });
});
