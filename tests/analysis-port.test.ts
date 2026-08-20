import { describe, expect, it, vi } from "vitest";
import { StructuredOutputLlmAdapter } from "../src/analysis/index.js";
import { createP3Harness, defaultProposal, startP3Search } from "./p3-helpers.js";

describe("P3 AnalysisPort adapters", () => {
  it("uses one validated contract for deterministic and structured-output adapters", async () => {
    const harness = createP3Harness();
    const run = startP3Search(harness, "analysis-context", { maxDepth: 0 });
    const context = harness.possibilities.getContext(run.rootContextSnapshotId)!;
    const proposal = defaultProposal({ context, remainingBudget: { maxDepth: 1 } });
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body.response_format).toBeTruthy();
      expect(String(init?.body)).not.toContain("runtime-secret");
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(proposal) } }],
        usage: { total_tokens: 123 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const adapter = new StructuredOutputLlmAdapter({
      endpoint: "https://example.invalid/v1/chat/completions",
      apiKey: "runtime-secret",
      provider: "openai-compatible-test",
      model: "synthetic-model",
      fetch: fetchMock as typeof fetch,
    });
    const result = await adapter.analyze({ context, remainingBudget: { maxTokens: 500 } });
    expect(result.proposal).toEqual(proposal);
    expect(result.usage.tokens).toBe(123);
    expect(fetchMock).toHaveBeenCalledOnce();
    harness.store.close();
  });

  it("rejects malformed structured output", async () => {
    const harness = createP3Harness();
    const run = startP3Search(harness, "malformed-context", { maxDepth: 0 });
    const context = harness.possibilities.getContext(run.rootContextSnapshotId)!;
    const adapter = new StructuredOutputLlmAdapter({
      endpoint: "https://example.invalid/v1/chat/completions",
      apiKey: "runtime-secret",
      provider: "test",
      model: "broken",
      fetch: (async () => new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 })) as typeof fetch,
    });
    await expect(adapter.analyze({ context, remainingBudget: { maxTokens: 10 } })).rejects.toThrow("proposal.schema");
    harness.store.close();
  });
});
