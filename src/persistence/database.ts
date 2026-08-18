import Database from "better-sqlite3";
import { migrateDatabase } from "./schema.js";

export class SqliteStore {
  readonly db: Database.Database;

  constructor(filename = ":memory:") {
    this.db = new Database(filename);
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("journal_mode = WAL");
    migrateDatabase(this.db);
  }

  transaction<T>(work: () => T): T {
    return this.db.transaction(work)();
  }

  close(): void {
    this.db.close();
  }
}
