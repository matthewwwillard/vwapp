/**
 * Climate PoC — verify two unknowns before building the feature:
 *   1. AUTH: does pretripclimate/start work with the carnet bearer (like
 *      lock/unlock)? (EV climate, not the ICE remote-start roToken path.)
 *   2. TIMER RESET: if we re-issue start while climate is ALREADY ON, does the
 *      car's `remainingClimatizationTimeMin` jump back up (~30)? This decides
 *      whether the cron can keep it warm by proactive restart.
 *
 * Reads climate state from GET /ev/v1/user/{userId}/vehicle/{uuid}/summary.
 * Always attempts a stop at the end. Run:
 *   pnpm --filter @vwapp/poc climate-probe
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
const userId = client.getUserId();
console.log(`Vehicle ${v.vehicleNickName ?? v.vin} (${uuid})`);

const pin: string = spin; // narrowed by the guard above; closures don't re-narrow
const start = (s: string) => client.spinSession(uuid, s);
const post = async (path: string, carnet: string) =>
  client.send("POST", path, undefined, { bearer: carnet });

// The EV summary (where climate state lives) is S-PIN-session-gated: it 403s
// with the access token and needs the carnet bearer. Mint one per read.
async function climateState(): Promise<{
  remaining: unknown;
  status: unknown;
  raw: unknown;
}> {
  const carnet = await start(pin);
  const r = await client.send(
    "GET",
    `/ev/v1/user/${userId}/vehicle/${uuid}/summary?tempUnit=fahrenheit`,
    undefined,
    { bearer: carnet },
  );
  const climate =
    (r.body?.data ?? r.body)?.climateStatus ?? r.body?.climateStatus;
  return {
    remaining: deepFind(climate, "remainingClimatizationTimeMin"),
    status: deepFind(climate, "climateStatusInd"),
    raw: climate?.climateStatusReport ?? climate,
  };
}

try {
  console.log("\n=== baseline climate state ===");
  const base = await climateState();
  console.log(
    "remaining=",
    base.remaining,
    "status=",
    JSON.stringify(base.status),
  );
  console.log("raw report:", JSON.stringify(base.raw).slice(0, 300));

  console.log("\n=== (1) START climate with carnet bearer ===");
  const carnet1 = await start(pin);
  const r1 = await post(`/ev/v1/vehicle/${uuid}/pretripclimate/start`, carnet1);
  console.log("start →", r1.status, JSON.stringify(r1.body).slice(0, 200));
  if (r1.status >= 300) {
    console.log(
      "\nStart did NOT accept with carnet bearer — auth differs; stopping probe.",
    );
  } else {
    console.log("\nWaiting for climate to spin up (poll remaining until > 0)…");
    let peak: number | null = null;
    for (let i = 0; i < 12; i++) {
      await sleep(6000);
      const s = await climateState();
      console.log(
        `  +${String((i + 1) * 6)}s remaining=${String(s.remaining)} status=${JSON.stringify(s.status)}`,
      );
      if (typeof s.remaining === "number" && s.remaining > 0) {
        peak = s.remaining;
        break;
      }
    }

    if (peak !== null) {
      console.log(
        `\n=== (2) TIMER-RESET test — climate on at ~${String(peak)} min; let it tick down ~130s ===`,
      );
      await sleep(130000);
      const before = await climateState();
      console.log(`  before re-start: remaining=${String(before.remaining)}`);
      console.log("  re-issuing START while already on…");
      const carnet2 = await start(pin);
      const r2 = await post(
        `/ev/v1/vehicle/${uuid}/pretripclimate/start`,
        carnet2,
      );
      console.log(
        "  re-start →",
        r2.status,
        JSON.stringify(r2.body).slice(0, 160),
      );
      for (let i = 0; i < 6; i++) {
        await sleep(8000);
        const s = await climateState();
        console.log(
          `    +${String((i + 1) * 8)}s remaining=${String(s.remaining)}`,
        );
      }
      console.log(
        "\n→ If remaining jumped back up toward 30 after re-start, proactive keepalive works.",
      );
    }
  }
} finally {
  console.log("\n=== STOP climate (cleanup) ===");
  try {
    const carnetStop = await start(pin);
    const rs = await post(
      `/ev/v1/vehicle/${uuid}/pretripclimate/stop`,
      carnetStop,
    );
    console.log("stop →", rs.status, JSON.stringify(rs.body).slice(0, 160));
    await sleep(8000);
    console.log("final remaining=", (await climateState()).remaining);
  } catch (e) {
    console.log("stop failed:", String(e).slice(0, 160));
  }
}

function deepFind(obj: unknown, key: string): any {
  if (obj === null || typeof obj !== "object") return undefined;
  if (key in (obj as Record<string, unknown>))
    return (obj as Record<string, unknown>)[key];
  for (const v of Object.values(obj as Record<string, unknown>)) {
    const found = deepFind(v, key);
    if (found !== undefined) return found;
  }
  return undefined;
}
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
