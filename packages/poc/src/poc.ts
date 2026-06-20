/**
 * Proof of concept: log in to VW Car-Net (myVW US) and print ID Buzz status.
 * Run with:  pnpm --filter @vwapp/poc status   (loads ../../.env)
 */
import { VwClient } from "./vwClient.ts";

const user = process.env.VW_USERNAME;
const password = process.env.VW_PASSWORD;
if (!user || !password) {
  console.error("Set VW_USERNAME and VW_PASSWORD in .env");
  process.exit(1);
}

const client = new VwClient(user, password);

console.log("Logging in to VW Car-Net (myVW)…");
await client.login();
console.log("✓ Authenticated\n");

const vehicles = await client.getVehicles();
console.log(`Found ${vehicles.length} vehicle(s):`);
for (const v of vehicles)
  console.log(
    `  - ${v.vehicleNickName ?? v.modelName ?? "?"}  (VIN ${v.vin ?? "?"})`,
  );
console.log();

for (const v of vehicles) {
  const uuid = v.vehicleId ?? v.uuid ?? v.vehicleIdInternal;
  const name = v.vehicleNickName ?? v.modelName ?? v.vin ?? uuid;
  console.log(`=== ${name} ===`);

  const [rvs, charge] = await Promise.allSettled([
    client.getRvs(uuid),
    client.getChargeSummary(uuid),
  ]);

  if (charge.status === "fulfilled") summarizeCharge(charge.value?.data ?? {});
  else
    console.log("  charge: (unavailable)", String(charge.reason).slice(0, 120));

  if (rvs.status === "fulfilled") summarizeRvs(rvs.value?.data ?? {});
  else console.log("  status: (unavailable)", String(rvs.reason).slice(0, 120));

  console.log();
}

function line(label: string, val: unknown): void {
  if (val !== undefined && val !== null && val !== "")
    console.log(`  ${label.padEnd(16)} ${val}`);
}

function summarizeCharge(d: any): void {
  const bat = d.batteryStatus ?? {};
  const chg = d.chargingStatus ?? {};
  const plug = d.plugStatus ?? {};
  const set = d.chargeSettings ?? {};
  const soc = bat.currentSOCPct ?? chg.currentSOCPct;
  line("Battery", soc != null ? `${soc}%` : undefined);
  line("Charging", chg.currentChargeState ?? chg.chargingState);
  if (chg.chargePower) line("  power", `${chg.chargePower} kW`);
  if (chg.remainingChargingTimeToComplete)
    line("  time to full", `${chg.remainingChargingTimeToComplete} min`);
  line(
    "Plug",
    [plug.plugConnectionState, plug.plugLockState].filter(Boolean).join(" / "),
  );
  line(
    "Target SoC",
    set.targetSOCPercentage != null ? `${set.targetSOCPercentage}%` : undefined,
  );
}

function summarizeRvs(d: any): void {
  const ext = d.exteriorStatus ?? {};
  const power = d.powerStatus ?? {};
  const locked = ext.secure === "SECURE";
  if (ext.secure)
    line("Locked", locked ? "yes (SECURE)" : `no (${ext.secure})`);
  const range = power.cruiseRange;
  if (range != null)
    line("Range", `${range} ${power.cruiseRangeUnits ?? ""}`.trim());
  const odo = d.currentMileage ?? power.odometer;
  if (odo != null) line("Odometer", `${odo} km`);
  // Open doors, if any.
  const openDoors = Object.entries(ext.doorStatus ?? {})
    .filter(([k, v]) => !k.endsWith("Timestamp") && v === "OPEN")
    .map(([k]) => k);
  if (openDoors.length) line("Doors open", openDoors.join(", "));
}
