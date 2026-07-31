// "agents" here means SUPPORT AGENTS (human staff), not AI agents.
import { Router } from "express";
import { query } from "../db.js";

export const agentsRouter = Router();

agentsRouter.get("/", async (_req, res) => {
  const result = await query("SELECT * FROM agents WHERE active = true ORDER BY name");
  res.json(result.rows);
});

agentsRouter.get("/:id/workload", async (req, res) => {
  const id = Number(req.params.id);
  const result = await query(
    `SELECT count(*)::int AS open_tickets
     FROM tickets
     WHERE assigned_agent_id = $1 AND status NOT IN ('resolved', 'closed')`,
    [id],
  );
  res.json(result.rows[0]);
});
