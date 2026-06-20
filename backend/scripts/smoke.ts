/**
 * Backend smoke test: drives the deployed/local Worker over oRPC with real VW
 * creds. Needs VW_USERNAME/VW_PASSWORD (root .env) plus INSTANT_APP_ID and
 * INSTANT_ADMIN_TOKEN (.dev.vars) to mint an auth token. Run after `wrangler dev`:
 *   node --env-file=../.env --env-file=.dev.vars scripts/smoke.ts
 */
import { init } from "@instantdb/admin";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { contract } from "@vwapp/contract";
import schema from "@vwapp/db";

const appId = process.env.INSTANT_APP_ID;
const adminToken = process.env.INSTANT_ADMIN_TOKEN;
if (!appId || !adminToken)
  throw new Error("set INSTANT_APP_ID / INSTANT_ADMIN_TOKEN");
const username = process.env.VW_USERNAME;
const password = process.env.VW_PASSWORD;
const spin = process.env.VW_PIN;
if (!username || !password || !spin)
  throw new Error("set VW_USERNAME / VW_PASSWORD / VW_PIN in .env");

// The Worker authenticates requests as Instant users; mint a token for a
// dedicated smoke-test user the same way the app's guest auth would.
const db = init({ appId, adminToken, schema });
const token = await db.auth.createToken({ email: "smoke-test@vwapp.invalid" });

const url = process.env.API_URL ?? "http://localhost:8787/rpc";
const link = new RPCLink({
  url,
  headers: { authorization: `Bearer ${token}` },
});
const client: ContractRouterClient<typeof contract> = createORPCClient(link);

console.log("→ auth.login");
console.log(
  "  ",
  JSON.stringify(await client.auth.login({ username, password, spin })),
);

console.log("→ auth.me");
console.log("  ", JSON.stringify(await client.auth.me()));

console.log("→ vehicle.refresh");
const status = await client.vehicle.refresh({});
console.log("  ", JSON.stringify(status, null, 2));

// Opt-in: `node ... scripts/smoke.ts lock|unlock` sends a real command.
const action = process.argv.find((a) => a === "lock" || a === "unlock");
if (action === "lock" || action === "unlock") {
  console.log(`→ vehicle.command ${action} (WATCH THE CAR)`);
  console.log("  ", JSON.stringify(await client.vehicle.command({ action })));
}

// Detach the smoke client from the shared VW session. Other clients (the
// app) stay logged in, and the session itself persists server-side either way.
console.log("→ auth.logout");
console.log("  ", JSON.stringify(await client.auth.logout()));
