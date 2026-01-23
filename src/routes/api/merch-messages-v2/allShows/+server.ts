import { error, json } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils.ts";
import type { RequestHandler } from "./$types";


export const GET = (async ({platform}) => {
  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  return json(
    await retryD1(() =>
      db.prepare("select showId from shows order by releaseDate DESC")
        .all<{showId: string}>()
        .then(r => r.results)
        .then(r => r.map(v => v.showId))
    )
  );
}) satisfies RequestHandler