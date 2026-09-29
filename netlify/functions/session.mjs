import { isAdmin, json } from "../lib/auth.mjs";
export default async (req) => json({ authenticated: await isAdmin(req) });
export const config = { path: "/api/session" };
