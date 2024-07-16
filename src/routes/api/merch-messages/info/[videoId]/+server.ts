import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";

export const GET = (async ({platform, params}) => {
  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const video = await db.prepare("select * from videos where videoId=?")
    .bind(params.videoId)
    .first<{videoId: string, status: string, title: string}>();

  return json({video});


}) satisfies RequestHandler;