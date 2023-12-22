import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { error } from "@sveltejs/kit";
import { first_news_post, type NewsPost } from "$lib/news/news.ts";
import { truncateText } from "$lib/utils.ts";

let first = true;

export const load = (async ({platform}) => {
  const db: D1Database = platform?.env?.DB;

  if(!db) throw error(503, "Database missing");

  // only run once per instance. In the future, we'll probably only need to run this on dev
  if(first) {
    first = false;
    await db.prepare("create table if not exists news (timestamp INTEGER PRIMARY KEY, url TEXT, title TEXT, body TEXT)").run();
    await Promise.all([
      db.prepare("create index if not exists idx_news_timestamp on news(timestamp)").run(),
      db.prepare("create index if not exists idx_news_url on news(url)").run(),
    ])
    await db.prepare("insert or ignore into news (timestamp, url, title, body) values (?, ?, ?, ?)")
      .bind(...first_news_post)
      .run()
  }

  return {
    results: await db.prepare("select * from news order by timestamp DESC")
      .all<NewsPost>()
      .then(r => r.results as unknown as NewsPost[])
      .then(r => r.map(n => {return {...n, body: truncateText(n.body, 500)}}))
  }
}) satisfies PageServerLoad;