/** Throwaway: verify the Worker's Instant-token auth path without VW creds. */
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

const url = process.env.API_URL ?? "http://localhost:8787/rpc";

function makeClient(
  headers: Record<string, string>,
): ContractRouterClient<typeof contract> {
  return createORPCClient(new RPCLink({ url, headers }));
}

console.log("→ auth.me with no token (expect UNAUTHORIZED)");
try {
  console.log("  unexpected success:", await makeClient({}).auth.me());
} catch (err) {
  console.log("  rejected:", err instanceof Error ? err.message : err);
}

console.log("→ auth.me with garbage token (expect UNAUTHORIZED)");
try {
  console.log(
    "  unexpected success:",
    await makeClient({ authorization: "Bearer garbage" }).auth.me(),
  );
} catch (err) {
  console.log("  rejected:", err instanceof Error ? err.message : err);
}

console.log("→ auth.me with valid Instant token (expect loggedIn:false)");
const db = init({ appId, adminToken, schema });
const token = await db.auth.createToken({ email: "auth-check@vwapp.invalid" });
console.log(
  "  ",
  JSON.stringify(
    await makeClient({ authorization: `Bearer ${token}` }).auth.me(),
  ),
);
