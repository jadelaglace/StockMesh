import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "./app.js";
import { createWorkbenchRuntime } from "../workbench/runtime.js";

const runtimeRoot = resolve(process.cwd(), "runtime");
mkdirSync(runtimeRoot, { recursive: true });
const databasePath = process.env.STOCKMESH_DB ?? resolve(runtimeRoot, "stockmesh-p4.sqlite");
const runtime = createWorkbenchRuntime(databasePath);
const app = await createServer(runtime);
const port = Number(process.env.PORT ?? 4310);
const host = process.env.HOST ?? "127.0.0.1";

const close = async (): Promise<void> => {
  await app.close();
  runtime.close();
};
process.once("SIGINT", () => void close());
process.once("SIGTERM", () => void close());

await app.listen({ port, host });
