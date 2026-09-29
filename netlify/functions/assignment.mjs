import { getManifest, store } from "../lib/store.mjs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[a-z0-9-]+$/.test(id)) return new Response("Not found", { status: 404 });
  const manifest = await getManifest();
  if (!manifest.assignments.some(a => a.id === id)) return new Response("Not found", { status: 404 });
  const html = await store.get(`assignments/${id}.html`, { type: "text" });
  if (html == null) return new Response("Assignment file not found", { status: 404 });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-downloads; default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src *; img-src * data: blob:; font-src * data:; media-src * data: blob:"
    }
  });
};

export const config = { path: "/api/assignment" };
