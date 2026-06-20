/**
 * InstantDB client. The app signs in as an Instant guest (its durable
 * identity) and live-queries vehicles/snapshots; permissions restrict it to
 * its own rows. All writes happen in the Worker.
 */
import "@/polyfills";
import { init } from "@instantdb/react-native";
import schema from "@vwapp/db";

const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID;
if (APP_ID === undefined)
  throw new Error("Set EXPO_PUBLIC_INSTANT_APP_ID in app/.env");

export const db = init({ appId: APP_ID, schema });
