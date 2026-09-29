import { isAdmin, json } from "../lib/auth.mjs";
import { getManifest } from "../lib/store.mjs";

export default async (req) => {
  const manifest = await getManifest();
  const url = new URL(req.url);
  const admin = url.searchParams.get("admin") === "1";
  if (admin && !(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);
  return json(manifest);
};

export const config = { path: "/api/assignments" };
