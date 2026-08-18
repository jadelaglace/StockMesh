import { SqliteStore } from "../persistence/database.js";

const filename = process.argv[2] ?? "stockmesh.db";
const store = new SqliteStore(filename);
const row = store.db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get() as { version: number };
console.log(`StockMesh schema ready: v${row.version} (${filename})`);
store.close();
