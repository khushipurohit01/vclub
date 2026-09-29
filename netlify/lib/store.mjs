import { getStore } from "@netlify/blobs";

export const store = getStore("vclub-assignments");
export const MANIFEST_KEY = "manifest.json";

export async function getManifest() {
  const raw = await store.get(MANIFEST_KEY, { type: "text" });
  if (!raw) return { version: 1, assignments: [] };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.assignments)) return { version: 1, assignments: [] };
    const assignments = parsed.assignments
      .filter(a => a && typeof a.id === "string" && /^[a-z0-9-]+$/.test(a.id))
      .map((a, index) => ({
        id: a.id,
        title: typeof a.title === "string" ? a.title : "Untitled assignment",
        description: typeof a.description === "string" ? a.description : "",
        originalName: typeof a.originalName === "string" ? a.originalName : "",
        createdAt: typeof a.createdAt === "string" ? a.createdAt : new Date(0).toISOString(),
        updatedAt: typeof a.updatedAt === "string" ? a.updatedAt : new Date(0).toISOString(),
        order: Number.isFinite(Number(a.order)) ? Number(a.order) : index
      }))
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
      .map((a, index) => ({ ...a, order: index }));
    return { version: 1, assignments };
  } catch {
    return { version: 1, assignments: [] };
  }
}

export async function saveManifest(manifest) {
  await store.set(MANIFEST_KEY, JSON.stringify({ version: 1, assignments: manifest.assignments }));
}
