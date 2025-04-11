import type { NewsPost } from "$lib/news/news.ts";
import { error, json } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils.ts";


export const GET = (async ({platform}) => {

  const db = platform?.env?.DB.withSession();

  if(!db) throw error(503, "Database missing");

  return json(
    await retryD1(() =>
      db.prepare("select url from news where timestamp <= ? order by timestamp DESC")
        .bind(Date.now())
        .all<NewsPost>()
        .then(r => r.results as unknown as NewsPost[])
        .then(r => r.map(n => n.url))
    )
  );
})