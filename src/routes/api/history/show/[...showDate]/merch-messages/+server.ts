import { error, json } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils";
import type { RequestHandler } from "./$types";
import type { MMV2TableRow } from "$lib/merch-messages/mm-types.ts";

export const GET = (async ({platform, params}) => {
  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const messages = await retryD1(() =>
    db.prepare("select * from merch_messages_v2 where show=? order by timestamp ASC")
      .bind(params.showDate)
      .all<MMV2TableRow>()
      .then(r => r.results)
  );

  return json(messages);

}) satisfies RequestHandler;