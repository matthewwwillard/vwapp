/** Keeping a stored VW account's tokens usable (refresh or re-login). */
import { unseal } from "./crypto";
import type { AppEnv } from "./env";
import { updateTokens, type Db, type StoredAccount } from "./store";
import { vwLogin, vwRefresh, type VwTokens } from "./vw/client";

/**
 * Get fresh VW tokens, refreshing / re-logging-in as needed, and persist them.
 *
 * Every transition logs an `[auth]` line: full password logins are VW's
 * throttled resource (~8-10 in quick succession locks the account out for a
 * while), so the log must show exactly when one happened and what triggered
 * it. Never log credentials or tokens — account ids only.
 */
export async function reauth(
  db: Db,
  env: AppEnv,
  account: StoredAccount,
  forceRelogin: boolean,
): Promise<VwTokens> {
  let tokens: VwTokens | null = null;
  if (!forceRelogin && account.tokens.refreshToken !== null) {
    try {
      tokens = await vwRefresh(account.tokens.refreshToken);
      console.log(`[auth] account=${account.id} token refresh ok`);
    } catch (err) {
      console.log(
        `[auth] account=${account.id} token refresh failed (${err instanceof Error ? err.message : "unknown"})`,
      );
    }
  }
  if (tokens === null) {
    const trigger = forceRelogin
      ? "forced"
      : account.tokens.refreshToken === null
        ? "no refresh token"
        : "refresh failed";
    console.log(
      `[auth] account=${account.id} VW password login (trigger=${trigger})`,
    );
    const credsJson = await unseal(env.CREDS_ENC_KEY, account.sealed);
    const creds = JSON.parse(credsJson) as {
      username: string;
      password: string;
    };
    try {
      tokens = await vwLogin(creds.username, creds.password);
      console.log(`[auth] account=${account.id} VW password login ok`);
    } catch (err) {
      console.error(
        `[auth] account=${account.id} VW password login FAILED: ${err instanceof Error ? err.message : "unknown"}`,
      );
      throw err;
    }
  }
  await updateTokens(db, account.id, tokens);
  return tokens;
}

/** The stored tokens if the access token is still valid, else a fresh set. */
export async function ensureTokens(
  db: Db,
  env: AppEnv,
  account: StoredAccount,
): Promise<VwTokens> {
  if (account.tokens.expiresAt > Date.now() + 60_000) return account.tokens;
  return reauth(db, env, account, false);
}
