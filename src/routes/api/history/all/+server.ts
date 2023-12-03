import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET = (async ({platform, params, locals, fetch}) => {
  const kvShows = fetch("/api/history/year/all").then(r => r.json());
  const oldShows = import("$lib/history/oldHistory.ts");

  return json([
    ...(await kvShows),
    ...((await oldShows).history)
  ])
}) satisfies RequestHandler;