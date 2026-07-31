import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/tickets.tsx"),
  route("tickets/:id", "routes/ticket-detail.tsx"),
] satisfies RouteConfig;
