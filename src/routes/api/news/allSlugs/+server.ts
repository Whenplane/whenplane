import type { NewsPost } from "$lib/news/news.ts";
import { truncateText } from "$lib/utils.ts";
import type { D1Database } from "@cloudflare/workers-types";
import { error, json } from "@sveltejs/kit";


export const GET = (async ({platform}) => {

  const db: D1Database | undefined = platform?.env?.DB;

  if(!db) throw error(503, "Database missing");

  return json(
    await db.prepare("select url from news where timestamp <= ? order by timestamp DESC")
    .bind(Date.now())
    .all<NewsPost>()
    .then(r => r.results as unknown as NewsPost[])
    .then(r => r.map(n => n.url))
  );
})