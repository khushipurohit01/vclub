import { getStore } from "@netlify/blobs";

export const store = getStore("vclub-assignments");
export const MANIFEST_KEY = "manifest.json";
const META_PREFIX = "assignments-meta/";

function normalizeAssignment(a, index = 0) {
  if (!a || typeof a.id !== "string" || !/^[a-z0-9-]+$/.test(a.id)) return null;
  return {
    id: a.id,
    title: typeof a.title === "string" && a.title.trim() ? a.title : "Untitled assignment",
    description: typeof a.description === "string" ? a.description : "",
    originalName: typeof a.originalName === "string" ? a.originalName : "",
    createdAt: typeof a.createdAt === "string" ? a.createdAt : new Date(0).toISOString(),
    updatedAt: typeof a.updatedAt === "string" ? a.updatedAt : new Date(0).toISOString(),
    order: Number.isFinite(Number(a.order)) ? Number(a.order) : index
  };
}

async function getLegacyManifest() {
  const raw = await store.get(MANIFEST_KEY, { type: "text" });
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.assignments)) return [];
    return parsed.assignments.map(normalizeAssignment).filter(Boolean);
  } catch {
    return [];
  }
}

export function metadataKey(id) {
  return `${META_PREFIX}${id}.json`;
}

export async function getAssignmentMeta(id) {
  const raw = await store.get(metadataKey(id), { type: "json" });
  return normalizeAssignment(raw);
}

export async function saveAssignmentMeta(assignment) {
  await store.set(metadataKey(assignment.id), JSON.stringify(assignment), {
    metadata: { contentType: "application/json" }
  });
}

export async function deleteAssignmentMeta(id) {
  await store.delete(metadataKey(id));
}

export async function getManifest() {
  const byId = new Map();

  // Current storage: one metadata blob per assignment.
  const { blobs: metaBlobs } = await store.list({ prefix: META_PREFIX });
  const metas = await Promise.all(
    metaBlobs
      .filter(({ key }) => key.endsWith(".json"))
      .map(async ({ key }) => normalizeAssignment(await store.get(key, { type: "json" })))
  );
  for (const item of metas.filter(Boolean)) byId.set(item.id, item);

  // Backwards compatibility with the original shared manifest.
  const legacy = await getLegacyManifest();
  for (const item of legacy) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }

  // Recovery: older versions could leave an HTML blob behind when its
  // manifest entry was overwritten by a concurrent upload. Discover those
  // orphaned files so an assignment cannot silently disappear after refresh.
  const { blobs: htmlBlobs } = await store.list({ prefix: "assignments/" });
  const orphanIds = htmlBlobs
    .map(({ key }) => key.match(/^assignments\/([a-z0-9-]+)\.html$/)?.[1])
    .filter(Boolean)
    .filter(id => !byId.has(id));

  if (orphanIds.length) {
    const recovered = await Promise.all(orphanIds.map(async id => {
      const metadata = await store.getMetadata(`assignments/${id}.html`);
      const title = typeof metadata?.metadata?.title === "string" && metadata.metadata.title.trim()
        ? metadata.metadata.title
        : id.replace(/-[a-f0-9]{8}$/, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const createdAt = new Date().toISOString();
      return normalizeAssignment({
        id,
        title,
        description: "",
        originalName: `${id}.html`,
        createdAt,
        updatedAt: createdAt,
        order: Number.MAX_SAFE_INTEGER
      });
    }));
    for (const item of recovered.filter(Boolean)) byId.set(item.id, item);
  }

  const assignments = [...byId.values()]
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    .map((a, index) => ({ ...a, order: index }));

  // Persist recovered records individually. This is deliberately not a
  // shared manifest write, so another upload cannot overwrite them.
  if (orphanIds.length) await Promise.all(assignments.filter(a => orphanIds.includes(a.id)).map(saveAssignmentMeta));

  return { version: 2, assignments };
}

// Kept for compatibility with older code. New writes do not use a shared
// manifest because it is not safe as a concurrent database record.
export async function saveManifest(manifest) {
  for (const assignment of manifest.assignments || []) {
    await saveAssignmentMeta(assignment);
  }
}
