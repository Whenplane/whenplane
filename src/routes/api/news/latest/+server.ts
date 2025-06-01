import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { NewsPost } from "$lib/news/news.ts";
import { retryD1, truncateText } from "$lib/utils.ts";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = (async ({platform}) => {

  const db = platform?.env?.DB?.withSession();
  if(!db) throw error(503, "Database missing");

  const response = await retryD1(() =>
    db.prepare("select * from news where timestamp <= ? order by timestamp DESC limit 1")
      .bind(Date.now() + (60 * 60e3))
      .all<NewsPost>()
      .then(r => r.results[0] as unknown as NewsPost)
      .then(n => {return {...n, body: truncateText(n.body, 500)}})
  )

  return json(response);
}) satisfies RequestHandler;
