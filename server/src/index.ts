import express from "express";
import { ticketsRouter } from "./routes/tickets.js";
import { customersRouter } from "./routes/customers.js";
import { agentsRouter } from "./routes/agents.js";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/tickets", ticketsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/agents", agentsRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Ticketflow API listening on :${port}`);
});
