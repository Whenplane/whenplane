import { text, type RequestHandler } from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils.ts";
import { dev } from "$app/environment";

let urls: string[] = [];
let lastURLsRefresh = 0;

export const GET = (async ({platform, fetch, url}) => {

  // refresh every 24 hours
  if(dev || Date.now() - lastURLsRefresh > 24 * 60 * 60e3) {
    urls = [
      "/",
      "/history",
      "/merch-messages",
      "/search",
      "/about",
      "/ltt-time",
      "/lttstore",
      "/lttstore/archive",
      "/extension",
      "/notifications",
    ]
    urls.push(
      ...(await fetch("/api/history/all")
        .then(r => r.json())
        .then((r: HistoricalEntry[]) =>
          r.map(s => s.name)
            .map(sn => ["/history/show/" + sn, "/history/show/" + sn + "/transcript"])
            .flat()
        ))
    )

    urls.push(
      ...(await fetch("/api/lttstore/allHandles")
        .then(r => r.json())
        .then((r: string[]) =>
          r
            .map(h => "/lttstore/products/" + h)
        ))
    )

    urls.push(
      ...(await fetch("/api/news/allSlugs")
        .then(r => r.json())
        .then((r: string[]) =>
          r
            .map(s => "/news/" + s)
        ))
    )

    urls.push(
      ...(await fetch("/api/merch-messages-v2/allShows")
        .then(r => r.json())
        .then((r: string[]) =>
          r
            .map(s => `/history/show/${s}/merch-messages`)
        ))
    )


    // these are at the bottom because they aren't important (and don't have SEO rn anyway)
    urls.push(...[
      "/lttstore/advanced-search",
      "/floatplane",
      "/lttstore/products",
      "/youtube-redirect",
      "/history/graph",
      "/history/graph/lateness",
      "/history/graph/preShowLength",
      "/history/graph/showLength",
    ])

    lastURLsRefresh = Date.now();
  }

  console.log("URLs length:", urls.length);


  return text(
    urls
      .map(u => url.origin + u)
      .join("\n")
  );

}) satisfies RequestHandler;