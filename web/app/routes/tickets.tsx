import { Link, useLoaderData, useSearchParams } from "react-router";
import { fetchTickets, type TicketSummary } from "../api";
import type { Route } from "./+types/tickets";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const tickets = await fetchTickets(status);
  return { tickets };
}

const STATUSES = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];

export default function Tickets() {
  const { tickets } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  const current = params.get("status");

  return (
    <div>
      <nav style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <Link to="/">all</Link>
        {STATUSES.map((s) => (
          <Link key={s} to={`/?status=${s}`} style={{ fontWeight: current === s ? "bold" : "normal" }}>
            {s}
          </Link>
        ))}
      </nav>
      <table cellPadding={6}>
        <thead>
          <tr>
            <th align="left">#</th>
            <th align="left">Subject</th>
            <th align="left">Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t: TicketSummary) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>
                <Link to={`/tickets/${t.id}`}>{t.subject}</Link>
              </td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
