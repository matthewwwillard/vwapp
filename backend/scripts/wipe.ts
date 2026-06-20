/** Dev helper: delete all rows so the app starts from a clean, logged-out slate. */
import { init } from "@instantdb/admin";
import schema from "@vwapp/db";

const appId = process.env.INSTANT_APP_ID;
const adminToken = process.env.INSTANT_ADMIN_TOKEN;
if (!appId || !adminToken)
  throw new Error("set INSTANT_APP_ID / INSTANT_ADMIN_TOKEN");

const db = init({ appId, adminToken, schema });

// Deleting an account cascades to its vehicles and on to their snapshots,
// but sweep every namespace anyway in case rows predate the cascade links.
const data = await db.query({
  $users: {},
  vwAccounts: {},
  vehicles: {},
  snapshots: {},
});
const txs = [
  ...data.vwAccounts.map((r) => db.tx.vwAccounts[r.id]?.delete()),
  ...data.vehicles.map((r) => db.tx.vehicles[r.id]?.delete()),
  ...data.snapshots.map((r) => db.tx.snapshots[r.id]?.delete()),
].filter((t) => t !== undefined);
if (txs.length > 0) await db.transact(txs);

for (const u of data.$users) {
  await db.auth.deleteUser({ id: u.id });
}
console.log(
  `wiped ${String(txs.length)} rows and ${String(data.$users.length)} users`,
);
