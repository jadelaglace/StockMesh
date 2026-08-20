import { describe, expect, it } from "vitest";
import { createBuiltinMethodRegistry } from "../src/methods/index.js";

describe("P2 Method registry", () => {
  it("registers the transparent built-in pack behind versioned contracts", () => {
    const registry = createBuiltinMethodRegistry();
    expect(registry.list().map((method) => `${method.id}@${method.version}`)).toEqual([
      "sna.community-louvain@1.0.0",
      "sna.foundation@1.0.0",
      "sna.pagerank@1.0.0",
      "sna.party-structural-vector@1.0.0",
      "sna.temporal-delta@1.0.0",
      "sna.temporal-delta@1.1.0",
    ]);
    expect(registry.get("sna.foundation").executor).toBe("graphology@0.26.0");
    expect(registry.get("sna.temporal-delta").version).toBe("1.1.0");
  });
});
