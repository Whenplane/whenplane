import { SearchClient } from "typesense";
import type { TimestampsDbRow } from "$lib/timestamps/types.ts";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";
import type { HistoricalEntry } from "$lib/utils.ts";
import type { PageServerLoad } from "./$types";
import { resultsPerPage } from "./search.ts";

const searchClient = new SearchClient({
  'nodes': [{
    'host': 'search.ajg0702.us',
    'port': 443,
    'protocol': 'https'
  }],
  // this api key only has access to search, don't worry
  'apiKey': "AdXAmPk7dwQJHdpIx7sAA1Fmil2WHoRi",
  'connectionTimeoutSeconds': 10
});

export const load = (async ({fetch, url}) => {
  const q = url.searchParams.get("q");
  let page = Number(url.searchParams.get("page") ?? 1)
  if(!q) return {};

  if(isNaN(page)) page = 1;

  const result = await searchClient.collections<TimestampsDbRow>("whenplane-timestamps").documents()
    .search({
      q,
      query_by: "name",
      page,
      per_page: resultsPerPage
    }, {cacheSearchResultsForSeconds: 60}) as SearchResponse<TimestampsDbRow>;

  const shows: {[videoId: string]: HistoricalEntry} = Object.fromEntries(
    await Promise.all(
      [...new Set(result.hits?.map(h => h.document.videoId))]
        .map(async (videoId) => {
          return [
            videoId,
            await fetch("/api/history/show/" + videoId)
              .then(r => {
                if(r.ok) {
                  return r.json()
                } else {
                  console.warn("Non-ok when fetching", videoId, r.status, r.statusText)
                  return undefined;
                }
              })
          ]
        })
    )
  )

  return {
    result,
    shows,
    page
  }
}) satisfies PageServerLoad