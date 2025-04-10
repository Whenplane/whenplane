import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { NewsPost } from "$lib/news/news.ts";
import { truncateText } from "$lib/utils.ts";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = (async ({platform}) => {

  const db = platform?.env?.DB?.withSession();
  if(!db) throw error(503, "Database missing");

  async function tryDB(attempt = 1): Promise<NewsPost>  {
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
