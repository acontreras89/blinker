import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

// One SQLite file (ADR-0002). Migrations run on boot so a fresh clone or a
// fresh e2e database needs no extra command.
const file = process.env.DATABASE_URL ?? "data/app.db";
if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });

const sqlite = new Database(file);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: "drizzle" });
