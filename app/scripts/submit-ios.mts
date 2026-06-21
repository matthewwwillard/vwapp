// Submit the latest iOS build to TestFlight, injecting the App Store Connect
// app id from the environment. EAS does NOT interpolate env vars in eas.json,
// and `eas submit` has no --asc-app-id flag — so we substitute the committed
// "$ASC_APP_ID" placeholder with the real value (from app/.env) just for the
// duration of the submit, then restore it. Keeps the owner-specific id out of
// committed config. Run via `pnpm run submit:ios` (which sources .env first).
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ascAppId = process.env.ASC_APP_ID;
if (ascAppId === undefined || !/^\d+$/.test(ascAppId)) {
  console.error(
    "ASC_APP_ID (digits only) must be set in app/.env to submit to TestFlight.",
  );
  process.exit(1);
}

const easPath = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  "eas.json",
);
const original = readFileSync(easPath, "utf8");
if (!original.includes('"$ASC_APP_ID"')) {
  console.error('eas.json is missing the "$ASC_APP_ID" submit placeholder.');
  process.exit(1);
}

try {
  writeFileSync(
    easPath,
    original.replace('"$ASC_APP_ID"', JSON.stringify(ascAppId)),
  );
  execSync(
    "npx -y eas-cli submit --platform ios --latest --profile production --non-interactive",
    { stdio: "inherit" },
  );
} finally {
  writeFileSync(easPath, original); // restore the placeholder, even on failure
}
