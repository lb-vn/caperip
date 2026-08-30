import { env } from "$env/dynamic/private";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (_db) return _db;
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const client = postgres(env.DATABASE_URL, { max: 10 });
  _db = drizzle(client, { schema });
  return _db;
}

// lazy so importing this doesn't need DATABASE_URL at build time
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const real = getDb();
    const value = real[prop as keyof typeof real];
    return typeof value === "function" ? value.bind(real) : value;
  },
});
