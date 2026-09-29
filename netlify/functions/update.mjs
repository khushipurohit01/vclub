import { isAdmin, json } from "../lib/auth.mjs";
import { getManifest, saveManifest } from "../lib/store.mjs";

export default async (req) => {
  if (!(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

  const manifest = await getManifest();
  const item = manifest.assignments.find(a => a.id === body.id);
  if (!item) return json({ error: "Assignment not found." }, 404);

  if (typeof body.title === "string") item.title = body.title.trim().slice(0, 120) || item.title;
  if (typeof body.description === "string") item.description = body.description.trim().slice(0, 300);
  item.updatedAt = new Date().toISOString();
  await saveManifest(manifest);
  return json({ ok: true, assignment: item });
};

export const config = { path: "/api/update" };
