import { env } from "$env/dynamic/private";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

// src/lib/server/db/ during dev, the bundle root once built
const CANDIDATES = [
  join(dirname(fileURLToPath(import.meta.url)), "../../../../drizzle"),
  join(process.cwd(), "drizzle"),
];

async function migrationsFolder(): Promise<string> {
  for (const path of CANDIDATES) {
    if (
      await access(join(path, "meta/_journal.json")).then(
        () => true,
        () => false,
      )
    )
      return path;
  }
  throw new Error("could not find the drizzle/ migrations folder");
}

// applies pending migrations only; drizzle tracks what has run in
// drizzle.__drizzle_migrations, so this is a no-op once the database is current
export async function bootstrapSchema(): Promise<void> {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");

  const folder = await migrationsFolder();
  const client = postgres(env.DATABASE_URL, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: folder });
  } finally {
    await client.end();
  }
}
