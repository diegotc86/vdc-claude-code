import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ticketflow</title>
        <Meta />
        <Links />
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "2rem" }}>
        <h1>Ticketflow</h1>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
