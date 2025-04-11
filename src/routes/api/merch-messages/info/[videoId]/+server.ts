import { error, json } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils";
import type { RequestHandler } from "./$types";

export const GET = (async ({platform, params}) => {
  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const video = await retryD1(() =>
    db.prepare("select * from videos where videoId=?")
      .bind(params.videoId)
      .first<{videoId: string, status: string, title: string}>()
  );

  return json({video});


}) satisfies RequestHandler;