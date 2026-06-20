// instant-cli reads this path; the real schema lives in @vwapp/db so the Expo
// app can share it.
import schema from "@vwapp/db";

export type { AppSchema } from "@vwapp/db";
export default schema;
