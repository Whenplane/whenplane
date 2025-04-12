import type {RequestHandler} from "./$types"
import { error, json } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils.ts";

export const GET = (async ({platform}) => {

  const db = platform?.env?.FP_SUBS_DB.withSession();
  if(!db) throw error(503, "Floatplane subs database not available!");

  const followHistory = await retryD1(() =>
    db.prepare("select * from boca_follower_history where timestamp > ?")
      .bind(Date.now() - (12.1 * 60 * 60e3))
      .all<{timestamp: number, followers: number}>()
      .then(r => r.results)
  );


  return json(
    {
      followHistory
    }
  )

}) satisfies RequestHandler