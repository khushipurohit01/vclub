import { getStore } from "@netlify/blobs";

export const store = getStore("vclub-assignments");
export const MANIFEST_KEY = "manifest.json";

export async function getManifest() {
  const raw = await store.get(MANIFEST_KEY, { type: "text" });
  if (!raw) return { version: 1, assignments: [] };
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.assignments) ? parsed : { version: 1, assignments: [] };
  } catch {
    return { version: 1, assignments: [] };
  }
}

export async function saveManifest(manifest) {
  await store.set(MANIFEST_KEY, JSON.stringify(manifest));
}
