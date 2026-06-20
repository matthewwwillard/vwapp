/** AES-GCM sealing of VW credentials at rest + helpers (Web Crypto only). */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Copy into a fresh ArrayBuffer-backed view (Web Crypto rejects SharedArrayBuffer). */
function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(u.length);
  copy.set(u);
  return copy.buffer;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  let s = "";
  for (const b of new Uint8Array(digest)) s += b.toString(16).padStart(2, "0");
  return s;
}

/**
 * Constant-time string equality — compare-time independent of where the
 * strings first differ, so it leaks no positional info via timing. Intended
 * for equal-length digests (e.g. sha256Hex output); a length mismatch returns
 * false immediately, which is fine when both sides are fixed-length hashes.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(fromBase64(base64Key)),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export interface Sealed {
  ciphertext: string;
  iv: string;
}

export async function seal(
  base64Key: string,
  plaintext: string,
): Promise<Sealed> {
  const key = await importKey(base64Key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoder.encode(plaintext)),
  );
  return { ciphertext: toBase64(new Uint8Array(ct)), iv: toBase64(iv) };
}

export async function unseal(
  base64Key: string,
  sealed: Sealed,
): Promise<string> {
  const key = await importKey(base64Key);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(fromBase64(sealed.iv)) },
    key,
    toArrayBuffer(fromBase64(sealed.ciphertext)),
  );
  return decoder.decode(pt);
}
