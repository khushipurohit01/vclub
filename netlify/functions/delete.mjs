import { isAdmin, json } from "../lib/auth.mjs";
import { getManifest, deleteAssignmentMeta, saveAssignmentMeta, store } from "../lib/store.mjs";

export default async (req) => {
  if (!(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (typeof body.id !== "string" || !/^[a-z0-9-]+$/.test(body.id)) return json({ error: "Invalid assignment id." }, 400);

  const manifest = await getManifest();
  const exists = manifest.assignments.some(a => a.id === body.id);
  if (!exists) return json({ error: "Assignment not found." }, 404);

  await Promise.all([
    store.delete(`assignments/${body.id}.html`),
    deleteAssignmentMeta(body.id)
  ]);

  const remaining = manifest.assignments.filter(a => a.id !== body.id);
  remaining.forEach((item, index) => { item.order = index; });
  await Promise.all(remaining.map(saveAssignmentMeta));

  return json({ ok: true });
};

export const config = { path: "/api/delete" };
