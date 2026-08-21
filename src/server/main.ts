import { createServer } from "./app.js";
import { createWorkbenchRuntime } from "../workbench/runtime.js";
import { defaultRuntimeDatabasePath } from "../workbench/paths.js";

const databasePath = process.env.STOCKMESH_DB ?? defaultRuntimeDatabasePath();
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
