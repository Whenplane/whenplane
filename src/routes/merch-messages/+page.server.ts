import { error, type ServerLoad } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";

export const load = (async ({platform, params}) => {

  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const videos = await db.prepare("select * from videos order by releaseDate DESC")
    .bind()
    .all<{videoId: string, status: string, title: string}>()
    .then(r => r.results);


  return {videos}

}) satisfies ServerLoad;