import { makeSession, sessionCookie, json } from "../lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return json({ error: "ADMIN_PASSWORD is not configured in Netlify." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (typeof body.password !== "string" || body.password !== password) {
    return json({ error: "Incorrect password." }, 401);
  }

  const token = await makeSession();
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
};

export const config = { path: "/api/login" };
