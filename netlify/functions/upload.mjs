import { isAdmin, json } from "../lib/auth.mjs";
import { getManifest, saveManifest, store } from "../lib/store.mjs";

const MAX_BYTES = 8 * 1024 * 1024;

function cleanText(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function slugify(value) {
  return cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `assignment-${Date.now()}`;
}

export default async (req) => {
  if (!(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let form;
  try { form = await req.formData(); } catch { return json({ error: "Please upload a valid HTML file." }, 400); }

  const title = cleanText(form.get("title"), 120);
  const description = cleanText(form.get("description"), 300);
  const file = form.get("file");
  if (!title) return json({ error: "Assignment name is required." }, 400);
  if (!(file instanceof File)) return json({ error: "Please choose an HTML file." }, 400);
  if (file.size > MAX_BYTES) return json({ error: "HTML file is too large. Maximum is 8 MB." }, 400);
  if (!file.name.toLowerCase().endsWith(".html") && !file.name.toLowerCase().endsWith(".htm")) {
    return json({ error: "Only .html or .htm files are accepted." }, 400);
  }

  const manifest = await getManifest();
  const id = `${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`;
  const order = manifest.assignments.length;
  const item = {
    id,
    title,
    description,
    originalName: file.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order
  };

  const html = await file.text();
  await store.set(`assignments/${id}.html`, html, {
    metadata: { contentType: "text/html; charset=utf-8", title }
  });
  manifest.assignments.push(item);
  try {
    await saveManifest(manifest);
  } catch (error) {
    await store.delete(`assignments/${id}.html`).catch(() => {});
    throw error;
  }
  return json({ ok: true, assignment: item });
};

export const config = { path: "/api/upload" };
