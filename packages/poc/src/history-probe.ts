/**
 * Research: how the stock app confirms a command completed. From the APK
 * (defpackage/mbg.java method `c`, orchestrated in mnc.java), after the command
 * returns {result, correlationId} the app polls
 *   GET /history/v1/vehicle/{uuid}/correlationId/{correlationId}/ro/
 * → { responseBody: string } until a terminal status, keeping the UI busy.
 *
 * This fires ONE lock (car ends locked) and polls that endpoint, printing the
 * raw responseBody each time so we can see the real status progression +
 * terminal value + cadence. No app/backend changes.
 *
 * Run:  pnpm --filter @vwapp/poc history-probe
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
const v = (await client.getVehicles())[0];
const uuid = v.vehicleId ?? v.uuid ?? v.vehicleIdInternal;

const carnet = await client.spinSession(uuid, spin);
const cmd = await client.send(
  "PUT",
  `/lockunlock/v1/vehicle/${uuid}`,
  { lock: true },
  { bearer: carnet },
);
const cid: string | undefined = cmd.body?.data?.correlationId;
console.log("lock issued →", JSON.stringify(cmd.body));
if (cid === undefined) process.exit(1);

const path = `/history/v1/vehicle/${uuid}/correlationId/${cid}/ro/`;
console.log(`\nPolling ${path}\n`);
const t0 = Date.now();
for (let i = 0; i < 25; i++) {
  // Try access-token auth; fall back to the carnet token if forbidden.
  let r = await client.send("GET", path);
  if (r.status === 401 || r.status === 403)
    r = await client.send("GET", path, undefined, { bearer: carnet });
  const t = `${String(Math.round((Date.now() - t0) / 1000))}s`;
  const rb: unknown =
    r.body?.data?.responseBody ?? r.body?.responseBody ?? r.body;
  console.log(
    `[${t}] ${r.status} responseBody=${typeof rb === "string" ? rb : JSON.stringify(rb)}`,
  );
  if (
    typeof rb === "string" &&
    /success|fail|finish|complete|error/i.test(rb)
  ) {
    console.log("\n→ terminal status reached");
    break;
  }
  await sleep(2500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
