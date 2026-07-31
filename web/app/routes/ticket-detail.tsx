import { Link, useLoaderData } from "react-router";
import { fetchTicket } from "../api";
import type { Route } from "./+types/ticket-detail";

export async function loader({ params }: Route.LoaderArgs) {
  const ticket = await fetchTicket(params.id);
  if (!ticket) {
    throw new Response("Not Found", { status: 404 });
  }
  return { ticket };
}

export default function TicketDetail() {
  const { ticket } = useLoaderData<typeof loader>();

  return (
    <div>
      <Link to="/">← back</Link>
      <h2>
        {ticket.ref}: {ticket.subject}
      </h2>
      <p>
        <strong>Status:</strong> {ticket.status}
        {" · "}
        <strong>Assignee:</strong> {ticket.assignee_name ?? "unassigned"}
      </p>
      <p>{ticket.body}</p>
    </div>
  );
}
