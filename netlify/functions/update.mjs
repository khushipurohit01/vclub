import { isAdmin, json } from "../lib/auth.mjs";
import { getManifest, saveAssignmentMeta } from "../lib/store.mjs";

export default async (req) => {
  if (!(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

  if (typeof body.id !== "string" || !/^[a-z0-9-]+$/.test(body.id)) return json({ error: "Invalid assignment id." }, 400);
  if (body.title !== undefined && typeof body.title !== "string") return json({ error: "Invalid title." }, 400);
  if (body.description !== undefined && typeof body.description !== "string") return json({ error: "Invalid description." }, 400);

  const manifest = await getManifest();
  const item = manifest.assignments.find(a => a.id === body.id);
  if (!item) return json({ error: "Assignment not found." }, 404);

  if (typeof body.title === "string") item.title = body.title.trim().slice(0, 120) || item.title;
  if (typeof body.description === "string") item.description = body.description.trim().slice(0, 300);
  item.updatedAt = new Date().toISOString();
  await saveAssignmentMeta(item);
  return json({ ok: true, assignment: item });
};

export const config = { path: "/api/update" };
