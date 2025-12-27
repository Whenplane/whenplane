import { error, json } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils";
import type { RequestHandler } from "./$types";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";

export const GET = (async ({platform, params}) => {
  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const messages = await retryD1(() =>
    db.prepare("select * from merch_messages where video=? order by imageIndex ASC")
      .bind(params.videoId)
      .all<MMTableRow>()
      .then(r => r.results)
  );

  return json(messages);


}) satisfies RequestHandler;