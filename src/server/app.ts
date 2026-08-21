import fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { WorkbenchRuntime } from "../workbench/runtime.js";
import { CapabilityInputError } from "../clients/capabilities.js";

function requiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required`);
  return value;
}

const safeCommandMessage = /^(?:[A-Za-z ]+ is required|Evidence time is invalid|decision must be accept or reject|(?:Position|Profile snapshot|Variation|Trajectory|Evaluation|search run|staging item) (?:not found|is unavailable):?)/;

export async function createServer(runtime: WorkbenchRuntime, options: { serveWeb?: boolean } = {}): Promise<FastifyInstance> {
  const app = fastify({ logger: process.env.NODE_ENV !== "test" });

  app.get("/api/health", async () => ({ status: "ok", mode: "synthetic-demo" }));
  app.get<{ Querystring: { positionId?: string } }>("/api/workbench", async (request) => {
    const envelope = await runtime.capabilities.execute("workbench.get", { positionId: request.query.positionId });
    return envelope.result;
  });

  app.post<{ Params: { capability: string }; Body: unknown }>("/api/capabilities/:capability", async (request) => (
    runtime.capabilities.execute(request.params.capability, request.body)
  ));

  app.post<{ Body: { text?: unknown; observedAt?: unknown } }>("/api/evidence/stage", async (request) => {
    const envelope = await runtime.capabilities.execute("evidence.stage", {
      text: requiredString(request.body?.text, "text"),
      observedAt: requiredString(request.body?.observedAt, "observedAt"),
    });
    const result = envelope.result as { stageId: string; snapshot: unknown };
    return { operation: "stage-evidence", message: "Evidence is staged for human review.", stageId: result.stageId, snapshot: result.snapshot };
  });

  app.post<{ Params: { stageId: string }; Body: { decision?: unknown } }>("/api/evidence/:stageId/review", async (request) => {
    const decision = requiredString(request.body?.decision, "decision");
    if (decision !== "accept" && decision !== "reject") throw new Error("decision must be accept or reject");
    runtime.service.reviewEvidence(request.params.stageId, decision);
    return { operation: "review-evidence", message: `Evidence ${decision}ed.`, snapshot: runtime.service.snapshot() };
  });

  app.post<{ Body: { positionId?: unknown } }>("/api/analysis/run", async (request) => {
    const positionId = requiredString(request.body?.positionId, "positionId");
    const envelope = await runtime.capabilities.execute("analysis.run", { positionId });
    const result = envelope.result as { runId: string; snapshot: unknown };
    return { operation: "run-analysis", message: "Analysis and bounded branch search completed.", runId: result.runId, snapshot: result.snapshot };
  });

  app.post<{ Params: { variationId: string } }>("/api/variations/:variationId/pin", async (request) => {
    const envelope = await runtime.capabilities.execute("branch.pin", { variationId: request.params.variationId });
    return { operation: "pin-variation", message: "Variation pinned without changing Main Line history.", snapshot: (envelope.result as { snapshot: unknown }).snapshot };
  });

  app.post<{ Params: { variationId: string } }>("/api/variations/:variationId/replay", async (request) => {
    const envelope = await runtime.capabilities.execute("decision.replay", { variationId: request.params.variationId });
    return { operation: "replay-variation", message: "Variation replayed with its frozen context.", snapshot: (envelope.result as { snapshot: unknown }).snapshot };
  });

  app.post<{ Params: { variationId: string } }>("/api/variations/:variationId/fork", async (request) => {
    const envelope = await runtime.capabilities.execute("branch.fork", { variationId: request.params.variationId });
    const result = envelope.result as { runId: string; snapshot: unknown };
    return { operation: "fork-variation", message: "A new Variation was forked; siblings remain intact.", runId: result.runId, snapshot: result.snapshot };
  });

  app.post<{ Params: { runId: string } }>("/api/search/:runId/resume", async (request) => {
    const envelope = await runtime.capabilities.execute("search.continue", { searchRunId: request.params.runId });
    return { operation: "resume-search", message: "Search resumed with an expanded explicit budget.", snapshot: (envelope.result as { snapshot: unknown }).snapshot };
  });

  app.post<{ Params: { proposalId: string } }>("/api/profile-revisions/:proposalId/apply", async (request) => {
    runtime.service.applyRevision(request.params.proposalId);
    return { operation: "apply-revision", message: "Reviewed Claim revision appended; historical snapshots remain unchanged.", snapshot: runtime.service.snapshot() };
  });

  app.setErrorHandler((error, request, reply) => {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof CapabilityInputError || safeCommandMessage.test(message)) {
      reply.status(400).send({ error: "workbench-command-rejected", message });
      return;
    }
    request.log.error(error);
    reply.status(500).send({ error: "workbench-command-failed", message: "The command could not be completed." });
  });

  const webRoot = resolve(process.cwd(), "dist-web");
  if (options.serveWeb !== false && existsSync(webRoot)) {
    await app.register(fastifyStatic, { root: webRoot, wildcard: false });
    app.get("/*", async (_request, reply) => reply.sendFile("index.html"));
  }
  return app;
}
