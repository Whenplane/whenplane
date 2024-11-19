import { SearchClient } from "typesense";
import type { TimestampsDbRow } from "$lib/timestamps/types.ts";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";
import type { HistoricalEntry } from "$lib/utils.ts";
import type { PageServerLoad } from "./$types";
import { resultsPerPage } from "./search.ts";
import type { CombinedSearchResult } from "$lib/search/search_types.ts";
import { dev } from "$app/environment";

const searchClient = new SearchClient({
  'nodes': [{
    'host': 'search.ajg0702.us',
    'port': 443,
    'protocol': 'https'
  }],
  // this api key only has access to search, don't worry
  'apiKey': "kxB1kGPA1HWgWuYtbDmWcr4y5aGKYsQf",
  'connectionTimeoutSeconds': 10
});

export const load = (async ({fetch, url}) => {
  const sp = url.searchParams;
  const q = url.searchParams.get("q");
  let page = Number(url.searchParams.get("page") ?? 1)
  if(!q) return {};

  if(isNaN(page)) page = 1;

  const types: string[] = [];
  if(sp.get("title") === "on") types.push("title");
  if(sp.get("topics") === "on") types.push("topic");
  if(sp.get("transcripts") === "on") types.push("transcript");
  if(sp.get("merch-messages") === "on") types.push("message", "reply");
  if(types.length === 0) {
    console.warn("No search type given! Defaulting to title,topics,transcripts")
    types.push("title", "topic", "transcript")
  }

  const result = await searchClient.collections<CombinedSearchResult>("whenplane-all").documents()
    .search({
      q,
      query_by: "text",
      sort_by: "_text_match(buckets: 10):desc,_eval([ (type:topic):3, (type:title):2, (type:message):1, (type:reply):1, (type:transcript):0 ]):desc",
      filter_by: "type:[" + types.join(",") + "]",
      page,
      per_page: resultsPerPage,
      exclude_fields: ["text"],
      highlight_fields: ["text"],
      highlight_affix_num_tokens: 15
    }, {cacheSearchResultsForSeconds: 60}) as SearchResponse<CombinedSearchResult>;

  const shows: {[videoId: string]: HistoricalEntry} = Object.fromEntries(
    await Promise.all(
      [...new Set(result.hits?.map(h => (h.document.videoId ?? (h.document as {showName?: string}).showName)))]
        .map(async (videoId) => {
          return [
            videoId,
            await fetch("/api/history/show/" + videoId)
              .then(r => {
                if(r.ok) {
                  return r.json();
                } else {
                  console.warn("Non-ok when fetching", videoId, r.status, r.statusText);
                  return undefined;
                }
              })
          ]
        })
    )
  )

  if(dev) console.debug(JSON.stringify(result, undefined, '\t'));

  return {
    result,
    shows,
    page
  }
}) satisfies PageServerLoad