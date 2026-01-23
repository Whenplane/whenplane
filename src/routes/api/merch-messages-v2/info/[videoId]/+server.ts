import { error, json } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils";
import type { RequestHandler } from "./$types";
import type { MMShow } from "$lib/merch-messages/mm-types.ts";

export const GET = (async ({platform, params}) => {
  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const show = await retryD1(() =>
    db.prepare("select * from shows where showId=?")
      .bind(params.videoId)
      .first<MMShow>()
  );

  return json({show});


}) satisfies RequestHandler;