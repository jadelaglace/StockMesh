import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export function defaultRuntimeDatabasePath(): string {
  const runtimeRoot = resolve(process.cwd(), "runtime");
  mkdirSync(runtimeRoot, { recursive: true });
  return resolve(runtimeRoot, "stockmesh-p4.sqlite");
}
