import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { NewsPost } from "$lib/news/news.ts";
import { newResponse, retryD1, truncateText } from "$lib/utils.ts";

let lastBackgroundUpdate = 0;

export const GET: RequestHandler = (async ({platform}) => {

  const db = platform?.env?.DB?.withSession();
  if(!db) throw error(503, "Database missing");

  async function doFetch(background = false) {
    if(!db) throw error(503, "Database missing");
    const response = await retryD1(() =>
      db.prepare("select * from news where timestamp <= ? order by timestamp DESC limit 1")
        .bind(Date.now() + (60 * 60e3))
        .all<NewsPost>()
        .then(r => r.results[0] as unknown as NewsPost)
        .then(n => {return {...n, body: undefined}})
    )
    if(cCache && cacheRequest) {
      const cachePromise = cCache.put(cacheRequest, json(response, {headers: {"x-fetched": new Date().toISOString()}}));
      if(background) {
        await cachePromise;
      } else {
        platform?.context?.waitUntil(cachePromise);
      }
    }
    return response;
  }

  let cCache: Cache | undefined = undefined;
  let cacheRequest: Request | undefined = undefined;
  if(typeof caches !== "undefined") {
    cCache = await caches.open("whenplane:newsCache");
    cacheRequest = new Request("https://newsCache/latest");
    const cacheMatch = await cCache.match(cacheRequest);

    if(cacheMatch) {
      const fetched = cacheMatch.headers.get("x-fetched")
      const distance = Date.now() - new Date(fetched ?? 0).getTime()
      if(distance < (5 * 60e3)) {
        return newResponse(cacheMatch);
      } else if(distance < (60 * 60e3)) {
        if(Date.now() - lastBackgroundUpdate > 60e3) {
          lastBackgroundUpdate = Date.now();
          platform?.context?.waitUntil(doFetch(true));
        }
        return newResponse(cacheMatch);
      }
    }
  } else {
    console.warn("missing cache api!")
  }

  const response = await doFetch();
  return json(response);
}) satisfies RequestHandler;
