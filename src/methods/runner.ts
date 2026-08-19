import type Database from "better-sqlite3";
import type { SqliteStore } from "../persistence/database.js";
import { PositionGraphAdapter } from "./graph-adapter.js";
import { stableHash, stableJson } from "./identity.js";
import type {
  GraphAdapterConfiguration,
  MethodDefinition,
  MethodExecutionContext,
  MethodRunRecord,
  MethodRunRequest,
} from "./types.js";
import type { MethodRegistry } from "./registry.js";

interface ExistingRunRow {
  id: string;
  method_id: string;
  method_version: string;
  position_id: string;
  position_projection_identity: string;
  input_identity: string;
  configuration_identity: string;
  configuration_json: string;
  executor: string;
  implementation_identity: string;
  status: "running" | "succeeded" | "failed";
  output_identity: string | null;
  output_schema: string | null;
  output_json: string | null;
  caveats_json: string | null;
}

function now(): string {
  return new Date().toISOString();
}

export class MethodRunner {
  private readonly adapter: PositionGraphAdapter;

  constructor(
    private readonly store: SqliteStore,
    private readonly registry: MethodRegistry,
  ) {
    this.adapter = new PositionGraphAdapter(store.db);
    this.syncDefinitions();
  }

  run<Output = unknown>(request: MethodRunRequest): MethodRunRecord<Output> {
    const definition = this.registry.get(request.methodId, request.methodVersion);
    const configuration = definition.normalizeConfiguration(request.configuration ?? {});
    const graphConfiguration = this.graphConfiguration(configuration);
    const position = this.adapter.loadPosition(request.positionId);
    const context: MethodExecutionContext = {
      position,
      adaptedGraph: this.adapter.adapt(position, graphConfiguration),
      loadPosition: (positionId) => this.adapter.loadPosition(positionId),
      loadGraph: (positionId, config) => this.adapter.adapt(this.adapter.loadPosition(positionId), config),
    };
    const inputDescriptor = definition.inputDescriptor?.(context, configuration) ?? context.adaptedGraph.inputDescriptor;
    const inputIdentity = stableHash(inputDescriptor);
    const configurationIdentity = stableHash(configuration);
    const runId = `method-run-${stableHash({
      methodId: definition.id,
      methodVersion: definition.version,
      implementationIdentity: definition.implementationIdentity,
      positionProjectionIdentity: position.projectionIdentity,
      inputIdentity,
      configurationIdentity,
    })}`;
    const existing = this.readRun<Output>(runId);
    if (existing?.status === "succeeded") return existing;

    this.store.db.prepare(`
      INSERT INTO method_runs (
        id, method_id, method_version, position_id, position_projection_identity,
        input_identity, configuration_identity, configuration_json, executor,
        implementation_identity, status, started_at, completed_at, error_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running', ?, NULL, NULL)
      ON CONFLICT(id) DO UPDATE SET status = 'running', started_at = excluded.started_at,
        completed_at = NULL, error_json = NULL
    `).run(
      runId, definition.id, definition.version, position.id, position.projectionIdentity,
      inputIdentity, configurationIdentity, stableJson(configuration), definition.executor,
      definition.implementationIdentity, now(),
    );

    try {
      const output = definition.execute(context, configuration);
      const serializedOutput = stableJson(output);
      const outputIdentity = stableHash({ runId, output });
      this.store.transaction(() => {
        this.store.db.prepare(`
          INSERT INTO method_results (run_id, output_identity, output_schema, output_json, caveats_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(run_id) DO UPDATE SET output_identity = excluded.output_identity,
            output_schema = excluded.output_schema, output_json = excluded.output_json,
            caveats_json = excluded.caveats_json, created_at = excluded.created_at
        `).run(runId, outputIdentity, definition.outputSchema, serializedOutput, stableJson(definition.caveats), now());
        this.store.db.prepare("UPDATE method_runs SET status = 'succeeded', completed_at = ?, error_json = NULL WHERE id = ?")
          .run(now(), runId);
      });
      return this.requireSucceededRun<Output>(runId);
    } catch (error) {
      this.store.transaction(() => {
        this.store.db.prepare("DELETE FROM method_results WHERE run_id = ?").run(runId);
        this.store.db.prepare("UPDATE method_runs SET status = 'failed', completed_at = ?, error_json = ? WHERE id = ?")
          .run(now(), stableJson({ name: error instanceof Error ? error.name : "Error", message: error instanceof Error ? error.message : String(error) }), runId);
      });
      throw error;
    }
  }

  rebuild<Output = unknown>(request: MethodRunRequest): MethodRunRecord<Output> {
    const current = this.run<Output>(request);
    this.store.transaction(() => {
      this.store.db.prepare("DELETE FROM method_results WHERE run_id = ?").run(current.id);
      this.store.db.prepare("DELETE FROM method_runs WHERE id = ?").run(current.id);
    });
    return this.run<Output>(request);
  }

  readRun<Output = unknown>(runId: string): MethodRunRecord<Output> | undefined {
    const row = this.selectRun(runId);
    if (!row) return undefined;
    return this.toRecord<Output>(row);
  }

  private requireSucceededRun<Output>(runId: string): MethodRunRecord<Output> {
    const record = this.readRun<Output>(runId);
    if (!record || record.status !== "succeeded") throw new Error(`Method run did not persist successfully: ${runId}`);
    return record;
  }

  private selectRun(runId: string): ExistingRunRow | undefined {
    return this.store.db.prepare(`
      SELECT r.*, x.output_identity, x.output_schema, x.output_json, x.caveats_json
      FROM method_runs r LEFT JOIN method_results x ON x.run_id = r.id WHERE r.id = ?
    `).get(runId) as ExistingRunRow | undefined;
  }

  private toRecord<Output>(row: ExistingRunRow): MethodRunRecord<Output> {
    return {
      id: row.id,
      methodId: row.method_id,
      methodVersion: row.method_version,
      positionId: row.position_id,
      positionProjectionIdentity: row.position_projection_identity,
      inputIdentity: row.input_identity,
      configurationIdentity: row.configuration_identity,
      configuration: JSON.parse(row.configuration_json) as unknown,
      executor: row.executor,
      implementationIdentity: row.implementation_identity,
      status: row.status,
      outputIdentity: row.output_identity ?? "",
      outputSchema: row.output_schema ?? "",
      output: (row.output_json === null ? null : JSON.parse(row.output_json)) as Output,
      caveats: row.caveats_json === null ? [] : JSON.parse(row.caveats_json) as string[],
    };
  }

  private syncDefinitions(): void {
    for (const definition of this.registry.list()) this.syncDefinition(definition, this.store.db);
  }

  private syncDefinition(definition: MethodDefinition<unknown, unknown>, db: Database.Database): void {
    const identityPayload = {
      methodId: definition.id,
      version: definition.version,
      title: definition.title,
      category: definition.category,
      executor: definition.executor,
      implementationIdentity: definition.implementationIdentity,
      outputSchema: definition.outputSchema,
      caveats: definition.caveats,
    };
    const definitionIdentity = stableHash(identityPayload);
    db.prepare(`
      INSERT OR IGNORE INTO method_definitions (
        method_id, version, title, category, executor, implementation_identity,
        output_schema, caveats_json, definition_identity, registered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      definition.id, definition.version, definition.title, definition.category,
      definition.executor, definition.implementationIdentity, definition.outputSchema,
      stableJson(definition.caveats), definitionIdentity, now(),
    );
    const existing = db.prepare("SELECT definition_identity FROM method_definitions WHERE method_id = ? AND version = ?")
      .get(definition.id, definition.version) as { definition_identity: string } | undefined;
    if (existing?.definition_identity !== definitionIdentity) throw new Error(`Method definition identity conflict: ${definition.id}@${definition.version}`);
  }

  private graphConfiguration(configuration: unknown): Partial<GraphAdapterConfiguration> {
    if (configuration !== null && typeof configuration === "object" && "graph" in configuration) {
      return ((configuration as { graph?: Partial<GraphAdapterConfiguration> }).graph) ?? {};
    }
    return {};
  }
}
