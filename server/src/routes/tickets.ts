import { Router } from "express";
import { query } from "../db.js";
import * as ticketService from "../services/ticketService.js";
import type { TicketStatus } from "../services/ticketService.js";
// @ts-expect-error untyped legacy module — see src/legacy/README.md
import { formatTicketRef } from "../legacy/ticketUtils.cjs";

export const ticketsRouter = Router();

ticketsRouter.get("/", async (req, res) => {
  const status = req.query.status as string | undefined;
  if (
    status &&
    ![
      "open",
      "in_progress",
      "waiting_on_customer",
      "resolved",
      "closed",
    ].includes(status)
  ) {
    res.status(400).json({ error: "invalid status" });
    return;
  }
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const countResult = status
    ? await query("SELECT COUNT(*) FROM tickets WHERE status = $1", [status])
    : await query("SELECT COUNT(*) FROM tickets");
  const total = parseInt(countResult.rows[0].count);

  const rows = status
    ? await query(
        `SELECT * FROM tickets WHERE status = $1 ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        [status],
      )
    : await query(
        `SELECT * FROM tickets ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      );

  res.json({ data: rows.rows, total, limit, offset });
});

ticketsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const result = await query(
    `SELECT t.*, a.name AS assignee_name
     FROM tickets t
     LEFT JOIN agents a ON a.id = t.assigned_agent_id
     WHERE t.id = $1`,
    [id],
  );
  const ticket = result.rows[0];
  if (!ticket) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({ ...ticket, ref: formatTicketRef(ticket) });
});

ticketsRouter.post("/", async (req, res) => {
  const { customer_id, subject, body } = req.body ?? {};
  if (!customer_id || !subject) {
    res.status(400).json({ error: "customer_id and subject are required" });
    return;
  }
  const result = await query(
    `INSERT INTO tickets (customer_id, subject, body, status)
     VALUES ($1, $2, $3, 'open') RETURNING *`,
    [customer_id, subject, body ?? ""],
  );
  res.status(201).json(result.rows[0]);
});

ticketsRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status, assigned_agent_id } = req.body ?? {};
  try {
    let ticket = null;
    if (status) {
      ticket = await ticketService.updateStatus(id, status as TicketStatus);
    }
    if (assigned_agent_id !== undefined) {
      ticket = await ticketService.assignTicket(id, Number(assigned_agent_id));
    }
    if (!ticket) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(ticket);
  } catch (err) {
    res
      .status(422)
      .json({ error: err instanceof Error ? err.message : "update failed" });
  }
});

ticketsRouter.post("/:id/reopen", async (req, res) => {
  const id = Number(req.params.id);
  const result = await query(
    `UPDATE tickets SET status = 'open', reopened_at = now(), updated_at = now()
     WHERE id = $1 AND status = 'closed' RETURNING *`,
    [id],
  );
  if (!result.rows[0]) {
    res.status(422).json({ error: "only closed tickets can be reopened" });
    return;
  }
  res.json(result.rows[0]);
});
