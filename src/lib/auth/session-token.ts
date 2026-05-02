const enc = new TextEncoder();

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

function bytesToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  return x === 0;
}

export async function sealSessionJson(secret: string, payload: object): Promise<string> {
  const key = await importHmacKey(secret);
  const json = JSON.stringify(payload);
  const payloadB64 = bytesToBase64Url(enc.encode(json).buffer);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sig = bytesToBase64Url(sigBuf);
  return `${payloadB64}.${sig}`;
}

export async function unsealSessionJson<T extends object>(secret: string, token: string): Promise<T | null> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const key = await importHmacKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const expected = bytesToBase64Url(sigBuf);
  if (!timingSafeEqualStr(sig, expected)) return null;
  try {
    const jsonBytes = base64UrlToBytes(payloadB64);
    const json = new TextDecoder().decode(jsonBytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
