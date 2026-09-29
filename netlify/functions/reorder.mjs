import { isAdmin, json } from "../lib/auth.mjs";
import { getManifest, saveManifest } from "../lib/store.mjs";

export default async (req) => {
  if (!(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (!Array.isArray(body.ids)) return json({ error: "ids must be an array." }, 400);

  const manifest = await getManifest();
  const byId = new Map(manifest.assignments.map(a => [a.id, a]));
  const reordered = [];
  for (const id of body.ids) {
    const item = byId.get(id);
    if (item) reordered.push(item);
    byId.delete(id);
  }
  for (const item of byId.values()) reordered.push(item);
  reordered.forEach((item, index) => { item.order = index; item.updatedAt = new Date().toISOString(); });
  manifest.assignments = reordered;
  await saveManifest(manifest);
  return json({ ok: true, assignments: reordered });
};

export const config = { path: "/api/reorder" };
