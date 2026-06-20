/**
 * Proof of concept: lock/unlock the ID Buzz (VW NA / Car-Net) end to end.
 * Verified live: body is { lock: boolean }, authorized with the S-PIN
 * carnetVehicleToken as the bearer. Defaults to unlock; pass `lock` to lock.
 *
 * Run:  pnpm --filter @vwapp/poc lock [lock|unlock]      (loads ../../.env)
 */
import { VwClient } from "./vwClient.ts";

const user = process.env.VW_USERNAME;
const password = process.env.VW_PASSWORD;
const spin = process.env.VW_PIN;
if (!user || !password || !spin) {
  console.error("Set VW_USERNAME, VW_PASSWORD, VW_PIN in .env");
  process.exit(1);
}

const client = new VwClient(user, password);

console.log("Logging in…");
await client.login();
const vehicles = await client.getVehicles();
const v = vehicles[0];
const uuid = v.vehicleId ?? v.uuid ?? v.vehicleIdInternal;
console.log(`✓ ${v.vehicleNickName ?? v.vin} (${uuid})\n`);

// Single, observable action (default unlock). Pass `lock` to lock instead.
const action: "lock" | "unlock" = process.argv.includes("lock")
  ? "lock"
  : "unlock";

console.log("initial:", await lockState());
console.log(`\n→ ${action.toUpperCase()} — WATCH/LISTEN to the car now`);
const res = await client.lockUnlock(action, uuid, spin);
console.log(`  [${res.status}] body:`, JSON.stringify(res.body).slice(0, 400));
// Poll RVS for a while; it lags the physical action, possibly by ~a minute.
for (const wait of [4000, 6000, 8000, 10000, 15000]) {
  await sleep(wait);
  console.log(`  …${await lockState()}`);
}

async function lockState(): Promise<string> {
  try {
    const rvs = await client.getRvs(uuid);
    const secure = rvs?.data?.exteriorStatus?.secure;
    return secure === "SECURE" ? "LOCKED" : `UNLOCKED (${secure ?? "?"})`;
  } catch (e) {
    return `(status error: ${String(e).slice(0, 80)})`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
