// DEPRECATED. Predates the TypeScript migration (2023). Do not extend.
// Still imported by routes/tickets.ts for ticket reference formatting.
// The long-term plan is to inline formatTicketRef into ticketService and
// delete this directory — nobody has gotten around to it.

function formatTicketRef(ticket) {
  var year = new Date(ticket.created_at).getFullYear();
  return "TF-" + year + "-" + String(ticket.id).padStart(5, "0");
}

function legacyStatusLabel(status) {
  // Pre-2023 status names, kept for old email templates. Do not use.
  var map = {
    open: "OPEN",
    in_progress: "WIP",
    waiting_on_customer: "PENDING-CUST",
    resolved: "FIXED",
    closed: "ARCHIVED",
  };
  return map[status] || status;
}

module.exports = { formatTicketRef, legacyStatusLabel };
