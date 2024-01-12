import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { NewsPost } from "$lib/news/news.ts";
import { truncateText } from "$lib/utils.ts";
import type { D1Database } from "@cloudflare/workers-types";


export const GET = (async ({platform}) => {

  const db: D1Database = platform?.env?.DB;

  if(!db) throw error(503, "Database missing");

  return json(
    await db.prepare("select * from news where timestamp <= ? order by timestamp DESC limit 1")
      .bind(Date.now() + (60 * 60e3))
      .all<NewsPost>()
      .then(r => r.results[0] as unknown as NewsPost)
      .then(n => {return {...n, body: truncateText(n.body, 500)}})
  );
}) satisfies RequestHandler;