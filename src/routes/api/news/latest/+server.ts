import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { NewsPost } from "$lib/news/news.ts";
import { truncateText } from "$lib/utils.ts";
import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import { vote_valid_for } from "$lib/voting.ts";


export const GET = (async ({platform}) => {

  const db: D1Database = platform?.env?.DB;

  if(!db) throw error(503, "Database missing");

  async function tryDB(attempt = 1): Promise<{id: string, timestamp: string, vote: string}[]> {
    if(!db) throw error(503, "Database unavailable!");
    return await db.prepare("select * from news where timestamp <= ? order by timestamp DESC limit 1")
      .bind(Date.now() + (60 * 60e3))
      .all<NewsPost>()
      .then(r => r.results[0] as unknown as NewsPost)
      .then(n => {return {...n, body: truncateText(n.body, 500)}})
      .catch(e => {
        console.warn("Attempt number " + attempt + " failed." + (attempt < 3 ? " Retrying." : ""));
        if(attempt < 3) {
          return tryDB(++attempt);
        } else {
          throw e;
        }
      })
  }

  return json(await tryDB());
}) satisfies RequestHandler;