import { pool, query } from "../src/db.js";

// Seed data for local development.

async function main() {
  await query(
    "TRUNCATE ticket_notes, tickets, customers, agents RESTART IDENTITY CASCADE",
  );

  await query(`INSERT INTO agents (name, email, active) VALUES
    ('Ana Souza', 'ana@ticketflow.dev', true),
    ('Bruno Lima', 'bruno@ticketflow.dev', true),
    ('Carla Reyes', 'carla@ticketflow.dev', true),
    ('Old Bot Account', 'bot@ticketflow.dev', false),
    ('Diego Santos (left 2025)', 'dsantos@ticketflow.dev', false)`);

  await query(`INSERT INTO customers (name, email, company) VALUES
    ('Acme Corp', 'it@acme.example', 'Acme'),
    ('Globex', 'help@globex.example', 'Globex'),
    ('Initech', 'support@initech.example', 'Initech'),
    ('Hooli', 'ops@hooli.example', 'Hooli')`);

  const statuses = [
    "open",
    "in_progress",
    "waiting_on_customer",
    "resolved",
    "closed",
  ];
  for (let i = 1; i <= 40; i++) {
    const customer = (i % 4) + 1;
    const status = statuses[i % statuses.length];
    const agent =
      i === 23
        ? 5
        : i === 29 || i === 35
          ? 4
          : status === "open"
            ? null
            : (i % 3) + 1;
    const subject =
      i === 40
        ? `Issue #${i}: production down — all our users are getting errors`
        : `Issue #${i}: ${["login fails", "billing question", "export broken", "slow dashboard", "API 500s"][i % 5]}`;
    const body =
      i === 40
        ? `Since this morning every user at customer ${customer} sees errors on login and the dashboard will not load. This is blocking our whole team. Please treat as an emergency.`
        : `Reported by customer ${customer}. Details for ticket ${i}.`;
    await query(
      `INSERT INTO tickets (customer_id, assigned_agent_id, subject, body, status, created_at)
       VALUES ($1, $2, $3, $4, $5, now() - ($6 || ' days')::interval)`,
      [customer, agent, subject, body, status, 45 - i],
    );
  }

  console.log("Seeded 5 agents, 4 customers, 40 tickets.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
