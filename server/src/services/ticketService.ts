import { query } from "../db.js";

export type TicketStatus =
  "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";

export interface Ticket {
  id: number;
  customer_id: number;
  assigned_agent_id: number | null;
  subject: string;
  body: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  reopened_at: string | null;
}

/**
 * Legal status transitions.
 */
const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress", "closed"],
  in_progress: ["waiting_on_customer", "resolved", "open"],
  waiting_on_customer: ["in_progress", "resolved"],
  resolved: ["closed", "in_progress"],
  closed: ["open"],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export async function getTicket(id: number): Promise<Ticket | null> {
  const result = await query<Ticket>("SELECT * FROM tickets WHERE id = $1", [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function updateStatus(
  id: number,
  to: TicketStatus,
): Promise<Ticket | null> {
  const ticket = await getTicket(id);
  if (!ticket) return null;
  if (!canTransition(ticket.status, to)) {
    throw new Error(`Illegal status transition: ${ticket.status} -> ${to}`);
  }
  const result = await query<Ticket>(
    "UPDATE tickets SET status = $2, updated_at = now() WHERE id = $1 RETURNING *",
    [id, to],
  );
  return result.rows[0];
}

export async function assignTicket(
  id: number,
  agentId: number,
): Promise<Ticket | null> {
  const result = await query<Ticket>(
    "UPDATE tickets SET assigned_agent_id = $2, updated_at = now() WHERE id = $1 RETURNING *",
    [id, agentId],
  );
  return result.rows[0] ?? null;
}
