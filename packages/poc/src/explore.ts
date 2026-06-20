/**
 * Read-only exploration: dump the full privileges/capabilities VW reports for
 * this user+vehicle, looking for a lock/unlock capability whose status isn't
 * "AVAILABLE" (which would explain why unlock is accepted but never actuates,
 * and why status reads 403 — a not-yet-enabled capability). No commands sent.
 *
 * Run:  pnpm --filter @vwapp/poc explore
 */
import { VwClient } from "./vwClient.ts";

const user = process.env.VW_USERNAME;
const password = process.env.VW_PASSWORD;
if (!user || !password) {
  console.error("Set VW_USERNAME / VW_PASSWORD in .env");
  process.exit(1);
}

const client = new VwClient(user, password);
await client.login();
const vehicles = await client.getVehicles();
const v = vehicles[0];
const uuid = v.vehicleId ?? v.uuid ?? v.vehicleIdInternal;
const userId = client.getUserId();
console.log(
  `Vehicle ${v.vehicleNickName ?? v.vin} (${uuid})  user ${userId}\n`,
);

console.log("=== /rrs/v1/privileges (full) ===");
const priv = await client.send(
  "GET",
  `/rrs/v1/privileges/user/${userId}/vehicle/${uuid}`,
);
console.log(JSON.stringify(priv.body, null, 2));

// Pull out each service + its status for a quick scan.
const services: any[] = priv.body?.data?.services ?? [];
if (services.length > 0) {
  console.log("\n=== services summary ===");
  for (const s of services) {
    const ops = (s.operations ?? []).map(
      (o: any) =>
        `${o.longCode ?? o.id ?? "?"}(${o.operationStatus ?? o.status ?? "?"})`,
    );
    console.log(
      `  ${s.serviceId ?? s.id ?? "?"} status=${s.capabilityStatus ?? s.serviceStatus ?? "?"} sub=${s.subscriptionStatus ?? "?"} ops=[${ops.join(", ")}]`,
    );
  }
}

console.log("\n=== /account/v1/garage (full) ===");
const garage = await client.send("GET", "/account/v1/garage");
console.log(JSON.stringify(garage.body, null, 2).slice(0, 4000));
