import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { contract } from "@vwapp/contract";
import Constants from "expo-constants";
import { db } from "./db";

const PROD_API_URL = "https://vwapp-api.sstur.workers.dev/rpc";

/**
 * EXPO_PUBLIC_API_URL overrides everything. Otherwise, when served by a Metro
 * dev server, target the Worker dev server on the same machine (hostUri is the
 * Metro host — localhost for a simulator, the LAN IP for a physical device);
 * a published bundle (EAS Update) has no dev server and targets prod.
 */
function resolveApiUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override !== undefined && override !== "") return override;
  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri !== undefined) {
    const host = hostUri.split(":")[0];
    if (host !== undefined && host !== "") return `http://${host}:8787/rpc`;
  }
  return PROD_API_URL;
}

/** Exported for display in Settings — "which backend am I talking to?". */
export const API_URL = resolveApiUrl();

const link = new RPCLink({
  url: API_URL,
  // The Worker verifies this Instant guest token to identify the user.
  headers: async () => {
    const user = await db.getAuth();
    return user === null
      ? {}
      : { authorization: `Bearer ${user.refresh_token}` };
  },
});

export const client =
  createORPCClient<ContractRouterClient<typeof contract>>(link);
export const orpc = createTanstackQueryUtils(client);
