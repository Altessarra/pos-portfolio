import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const schema = process.env.DATABASE_SCHEMA || "public";
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
  throw new Error("DATABASE_SCHEMA must be a valid PostgreSQL schema name");
}

const client = postgres(process.env.DATABASE_URL, {
  connection: { options: `-c search_path=${schema}` }
});

export const db = drizzle(client);
export { client };
