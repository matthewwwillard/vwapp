export interface AppEnv {
  INSTANT_APP_ID: string;
  INSTANT_ADMIN_TOKEN: string;
  /** base64 of 32 random bytes — AES-GCM key for sealing VW credentials. */
  CREDS_ENC_KEY: string;
}
