import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";

export const customersRouter = Router();

const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional(),
});

customersRouter.get("/", async (_req, res) => {
  const result = await query("SELECT * FROM customers ORDER BY name");
  res.json(result.rows);
});

customersRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const result = await query("SELECT * FROM customers WHERE id = $1", [id]);
  if (!result.rows[0]) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(result.rows[0]);
});

customersRouter.post("/", async (req, res) => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { name, email, company } = parsed.data;
  const result = await query(
    "INSERT INTO customers (name, email, company) VALUES ($1, $2, $3) RETURNING *",
    [name, email, company ?? null],
  );
  res.status(201).json(result.rows[0]);
});
