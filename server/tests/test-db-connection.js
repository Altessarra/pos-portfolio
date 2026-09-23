import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
});

try {
  const result = await sql`
    SELECT
      NOW() AS current_time,
      current_database() AS database_name
  `;

  console.log("✅ Connected to Supabase Postgres");
  console.log(result[0]);
} catch (error) {
  console.error("❌ Database connection failed");
  console.error(error);
} finally {
  await sql.end();
}