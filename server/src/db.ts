import pg from "pg";

export const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgres://ticketflow:ticketflow@localhost:5433/ticketflow",
});

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}
