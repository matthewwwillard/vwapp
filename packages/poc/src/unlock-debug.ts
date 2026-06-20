/**
 * THE FIX (from the myVW APK): the lock/unlock body is { "lock": boolean },
 * NOT { "action": "lock"|"unlock" }. We'd been sending `action`, which VW
 * ignored — so our "unlock" was never actually an unlock (and "lock" worked
 * only incidentally). Unlock = { "lock": false }.
 *
 * Run:  pnpm --filter @vwapp/poc unlock-debug      (car should be LOCKED)
 */
import { VwClient } from "./vwClient.ts";

const user = process.env.VW_USERNAME;
const password = process.env.VW_PASSWORD;
const spin = process.env.VW_PIN;
if (!user || !password || !spin) {
  console.error("Set VW_USERNAME / VW_PASSWORD / VW_PIN in .env");
  process.exit(1);
}

const client = new VwClient(user, password);
await client.login();
const vehicles = await client.getVehicles();
const v = vehicles[0];
const uuid = v.vehicleId ?? v.uuid ?? v.vehicleIdInternal;
console.log(
  `Vehicle ${v.vehicleNickName ?? v.vin} (${uuid})  baseline:`,
  await lockState(),
);
client.debug = true;

const carnet = await client.spinSession(uuid, spin);
console.log(
  '\n=== UNLOCK with correct body { "lock": false } (bearer = carnet token) ===',
);
const put = await client.send(
  "PUT",
  `/lockunlock/v1/vehicle/${uuid}`,
  { lock: false },
  { bearer: carnet },
);
console.log("result:", JSON.stringify(put.body));

console.log("\nWatching RVS ~75s…");
let unlocked = false;
for (let i = 0; i < 10; i++) {
  await sleep(7500);
  const s = await lockState();
  console.log(`  ${s}`);
  if (s === "UNLOCKED") {
    unlocked = true;
    break;
  }
}

if (unlocked) {
  console.log("\n*** UNLOCKED! Re-locking to secure… ***");
  const carnet2 = await client.spinSession(uuid, spin);
  await client.send(
    "PUT",
    `/lockunlock/v1/vehicle/${uuid}`,
    { lock: true },
    { bearer: carnet2 },
  );
  await sleep(8000);
  console.log("after re-lock:", await lockState());
} else {
  console.log("\nStill locked after ~75s — try bearer=accessToken next.");
}

async function lockState(): Promise<string> {
  const rvs = await client.getRvs(uuid);
  return rvs?.data?.exteriorStatus?.secure === "SECURE" ? "LOCKED" : "UNLOCKED";
}
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
