import { error, type ServerLoad } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";

export const load = (async ({platform, params}) => {

  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const messages = await db.prepare("select * from merch_messages where video=?")
    .bind(params.videoId)
    .all<MMTableRow>()
    .then(r => r.results);

  return {messages}

}) satisfies ServerLoad;