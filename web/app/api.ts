const API_BASE = process.env.API_BASE ?? "http://localhost:3001";

export interface TicketSummary {
  id: number;
  subject: string;
  status: string;
  assigned_agent_id: number | null;
  created_at: string;
}

export interface TicketDetail extends TicketSummary {
  body: string;
  assignee_name: string | null;
  ref: string;
}

export async function fetchTickets(status?: string): Promise<TicketSummary[]> {
  const url = status
    ? `${API_BASE}/api/tickets?status=${status}`
    : `${API_BASE}/api/tickets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load tickets: ${res.status}`);
  return res.json();
}

export async function fetchTicket(id: string): Promise<TicketDetail | null> {
  const res = await fetch(`${API_BASE}/api/tickets/${id}`);
  if (!res.ok) return null;
  return res.json();
}
