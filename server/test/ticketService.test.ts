import { describe, it, expect } from "vitest";
import { canTransition } from "../src/services/ticketService.js";

describe("canTransition", () => {
  it("allows open -> in_progress", () => {
    expect(canTransition("open", "in_progress")).toBe(true);
  });

  it("allows resolved -> closed", () => {
    expect(canTransition("resolved", "closed")).toBe(true);
  });

  it("rejects open -> resolved (must pass through in_progress)", () => {
    expect(canTransition("open", "resolved")).toBe(false);
  });
});
