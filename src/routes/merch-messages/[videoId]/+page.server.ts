import { error, type ServerLoad } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";

export const load = (async ({platform, params}) => {

  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const video = await db.prepare("select * from videos where videoId=?")
    .bind(params.videoId)
    .first<{videoId: string, status: string, title: string}>();

  if(video === null) {
    throw error(404, "Video not found (or not processed yet)")
  }

  const messages = await db.prepare("select * from merch_messages where video=? order by imageIndex ASC")
    .bind(params.videoId)
    .all<MMTableRow>()
    .then(r => r.results);

  return {video, messages}

}) satisfies ServerLoad;