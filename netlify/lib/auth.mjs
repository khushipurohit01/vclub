const COOKIE = "vclub_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

export async function makeSession() {
  const secret = process.env.ADMIN_PASSWORD || "";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = toBase64Url(await hmac(timestamp, secret));
  return `${timestamp}.${signature}`;
}

export async function isAdmin(req) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!match) return false;

  const [timestamp, signature] = decodeURIComponent(match[1]).split(".");
  if (!timestamp || !signature) return false;
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE) return false;

  const secret = process.env.ADMIN_PASSWORD || "";
  const expected = toBase64Url(await hmac(timestamp, secret));
  if (signature.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

export function sessionCookie(value) {
  return `${COOKIE}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function clearCookie() {
  return `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra }
  });
}
