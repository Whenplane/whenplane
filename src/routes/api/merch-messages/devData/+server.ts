import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";


export const GET = (async ({platform, params}) => {
  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const videos = await db.prepare("select * from videos")
    .all()
    .then(r => r.results);

  const merchMessages = await db.prepare("select * from merch_messages where video = ?")
    .bind("hdG4vuTAE3Q")
    .all()
    .then(r => r.results);

  return json({videos, merchMessages})

}) satisfies RequestHandler