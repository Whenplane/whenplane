import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";


export const GET = (async ({platform}) => {
  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  return json(
    await db.prepare("select videoId from videos order by releaseDate DESC")
      .all<{videoId: string}>()
      .then(r => r.results)
      .then(r => r.map(v => v.videoId))
  );
}) satisfies RequestHandler