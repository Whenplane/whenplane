import { error, type ServerLoad } from "@sveltejs/kit";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";
import { retryD1 } from "$lib/utils.ts";

export const load = (async ({platform, params}) => {

  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const video = await retryD1(() =>
    db.prepare("select * from videos where videoId=?")
      .bind(params.videoId)
      .first<{videoId: string, status: string, title: string}>()
  );

  if(video === null) {
    throw error(404, "Video not found (or not processed yet)")
  }

  const messages = await retryD1(() =>
    db.prepare("select * from merch_messages where video=? order by imageIndex ASC")
      .bind(params.videoId)
      .all<MMTableRow>()
      .then(r => r.results)
  );

  return {video, messages}

}) satisfies ServerLoad;