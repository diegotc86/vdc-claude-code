/**
 * ticketflow-db — read-only Postgres MCP server.
 *
 * Three tools: list_tables, describe_table, query (a single SELECT/WITH,
 * wrapped in a READ ONLY transaction, LIMIT 200 enforced).
 *
 * Two principles from the minimal-agent workshop, in a new costume:
 *  - tool descriptions are prompts — "use list_tables first if unsure" steers
 *    the model's WORKFLOW, not just the call, and saves failed round trips;
 *  - tool errors are feedback — every failure is RETURNED as text, never
 *    thrown, and says what to do about it.
 *
 * And the cleanest permission rule there is: there is no write tool to gate,
 * by construction.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgres://ticketflow:ticketflow@localhost:5433/ticketflow",
  max: 3,
});

const MAX_ROWS = 200;

function asTable(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "(no rows)";
  const cols = Object.keys(rows[0]);
  const header = `| ${cols.join(" | ")} |`;
  const sep = `| ${cols.map(() => "---").join(" | ")} |`;
  const body = rows
    .map(
      (r) =>
        `| ${cols
          .map((c) => String(r[c] ?? "NULL").replaceAll("|", "\\|").slice(0, 120))
          .join(" | ")} |`,
    )
    .join("\n");
  return [header, sep, body].join("\n");
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

const server = new McpServer({ name: "ticketflow-db", version: "1.0.0" });

server.registerTool(
  "list_tables",
  {
    description:
      "List all tables in the Ticketflow database with approximate row counts. " +
      "Start here if you don't know the schema.",
    inputSchema: {},
  },
  async () => {
    try {
      const result = await pool.query(`
        SELECT c.relname AS table, c.reltuples::bigint AS approx_rows
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname`);
      return { content: [{ type: "text", text: asTable(result.rows) }] };
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
);

server.registerTool(
  "describe_table",
  {
    description:
      "Describe a table: columns with types/nullability/defaults, plus constraints " +
      "and indexes. Use before writing queries against unfamiliar tables.",
    inputSchema: { table: z.string().describe("Table name, e.g. 'tickets'") },
  },
  async ({ table }) => {
    try {
      const cols = await pool.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table],
      );
      if (cols.rows.length === 0) {
        // An error that teaches: list what IS available instead of just failing.
        const tables = await pool.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`,
        );
        return errorResult(
          `table '${table}' not found. Available: ${tables.rows
            .map((r) => r.table_name)
            .join(", ")}`,
        );
      }
      const constraints = await pool.query(
        `SELECT conname, pg_get_constraintdef(oid) AS definition
         FROM pg_constraint WHERE conrelid = $1::regclass`,
        [table],
      );
      const indexes = await pool.query(
        `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=$1`,
        [table],
      );
      const text = [
        `## Columns\n${asTable(cols.rows)}`,
        `## Constraints\n${asTable(constraints.rows)}`,
        `## Indexes\n${asTable(indexes.rows)}`,
      ].join("\n\n");
      return { content: [{ type: "text", text }] };
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
);

server.registerTool(
  "query",
  {
    description:
      "Run a read-only SQL query (a single SELECT or WITH statement, max " +
      `${MAX_ROWS} rows) against the Ticketflow Postgres database. ` +
      "Use list_tables and describe_table first if unsure of the schema.",
    inputSchema: { sql: z.string().describe("A single SELECT/WITH statement.") },
  },
  async ({ sql }) => {
    const trimmed = sql.trim().replace(/;\s*$/, "");
    // Layer 1: shape check — a single statement that starts like a read.
    if (!/^(select|with)\b/i.test(trimmed)) {
      return errorResult("only SELECT/WITH queries are allowed.");
    }
    if (trimmed.includes(";")) {
      return errorResult("multiple statements are not allowed.");
    }
    const client = await pool.connect();
    try {
      // Layer 2: the database enforces read-only regardless of what layer 1
      // missed. `WITH x AS (UPDATE ...) SELECT` passes the regex; it dies here.
      await client.query("BEGIN TRANSACTION READ ONLY");
      const result = await client.query(`SELECT * FROM (${trimmed}) AS _sub LIMIT ${MAX_ROWS}`);
      await client.query("COMMIT");
      const note = result.rows.length === MAX_ROWS ? `\n(capped at ${MAX_ROWS} rows)` : "";
      return { content: [{ type: "text", text: asTable(result.rows) + note }] };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      return errorResult(err instanceof Error ? err.message : String(err));
    } finally {
      client.release();
    }
  },
);

await server.connect(new StdioServerTransport());
console.error("ticketflow-db MCP server running (stdio)");
