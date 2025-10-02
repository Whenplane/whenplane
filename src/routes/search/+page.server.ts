import { SearchClient } from "typesense";
import type { SearchResponse } from "typesense/lib/Typesense/Documents";
import { type HistoricalEntry, wait } from "$lib/utils.ts";
import type { PageServerLoad } from "./$types";
import { resultsPerPage } from "./search.ts";
import type { CombinedSearchResult } from "$lib/search/search_types.ts";
import { dev } from "$app/environment";
import { error, redirect } from "@sveltejs/kit";

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
const hybridSearchClient = new SearchClient({
  'nodes': [{
    'host': 'search.ajg0702.us',
    'port': 443,
    'protocol': 'https'
  }],
  // this api key only has access to search, don't worry
  'apiKey': "AdXAmPk7dwQJHdpIx7sAA1Fmil2WHoRi",
  'connectionTimeoutSeconds': 10
});

let showsCache: Promise<HistoricalEntry[]> | undefined;
let showsFetched = 0;

export const load = (async ({fetch, url, cookies, platform}) => {
  const sp = url.searchParams;
  const q = url.searchParams.get("q");
  let page = Number(url.searchParams.get("page") ?? 1);

  if(!showsCache || Date.now() - showsFetched > 60 * 60e3) {
    showsFetched = Date.now()
    showsCache = fetch("/api/history/all")
      .then(r => r.json())
      .then(r => {
        showsFetched = Date.now();
        return r;
      })
    platform?.context?.waitUntil(showsCache)
  }

  if(!q) {
    return {};
  }

  const warnings: string[] = [];

  const allShows = await Promise.any([showsCache, wait(5e3).then(() => "Timed Out")]);
  if(!allShows) throw error(500, "Shows is falsy!");
  if(typeof allShows === "string") {
    if(allShows === "Timed Out") {
      if(Date.now() - showsFetched > 30e3) {
        // Fetching all shows really shouldn't take more than 30 seconds. lets invalidate the cache
        showsCache = undefined;
      }
      throw error(500, "Timed out fetching shows!")
    } else {
      console.error("Fetching shows failed with unknown reason:", allShows);
      throw error(500, "Fetching shows failed with unknown reason!")
    }
  }

  if(isNaN(page)) page = 1;

  const types: string[] = [];
  if(sp.get("title") === "on") types.push("title");
  if(sp.get("topics") === "on") types.push("topic");
  if(sp.get("transcripts") === "on") types.push("transcript-chunk");
  if(sp.get("merch-messages") === "on") types.push("message", "reply");
  if(types.length === 0) {
    console.warn("No search type given! Redirecting to add to title,topics,transcripts")
    throw redirect(302, "/search?q=" + encodeURIComponent(q) + "&title=on&topics=on&transcripts=on")
  }

  const before = sp.get("before")?.replaceAll("-", "");
  const after = sp.get("after")?.replaceAll("-", "");

  const urlSort = sp.get("sort")
  let sort = "_text_match(bucket_size: 5):desc,sortWeight:desc,_text_match:desc";
  if(urlSort && urlSort !== "default") {
    if(urlSort === "showDate") {
      sort = "_text_match(bucket_size: 5):desc,showDate:desc,_text_match:desc";
    } else if(urlSort === "showDateOldest") {
      sort = "_text_match(bucket_size: 5):desc,showDate:asc,_text_match:desc";
    } else if(urlSort === "type") {
      sort = "_text_match(bucket_size: 5):desc,_eval([ (type:topic):3, (type:title):2, (type:message):1, (type:reply):1, (type:transcript):0 ]):desc,_text_match:desc";
    } else if(urlSort === "relevance") {
      sort = "_text_match:desc"
    } else {
      warnings.push(`Unknown sorting type '${sort}'. Using default sorting.`);
    }
  }

  const result = await searchClient.collections<CombinedSearchResult>("whenplane-all").documents()
    .search({
      q,
      query_by: url.searchParams.get("keyword") === "on" ? "text" : "text,embedding",
      sort_by: sort,
      filter_by: "type:[" + types.join(",") + "] " + (!before ? "" : "&& showDate:<" + before) + (!after ? "" : "&& showDate:>" + after),
      page,
      per_page: resultsPerPage,
      exclude_fields: ["text", "embedding"],
      highlight_fields: ["text"],
      highlight_affix_num_tokens: 15,
      prefix: false
    }, {cacheSearchResultsForSeconds: 60}) as SearchResponse<CombinedSearchResult>;

  const showHits = [...new Set(result.hits?.map(h => (h.document.videoId ?? (h.document as {showName?: string}).showName)))]

  const shows: {[videoId: string]: HistoricalEntry} = Object.fromEntries(
    showHits.map(showId => {
      const show = allShows.find(s => s.metadata.vods?.youtube === showId || s.name === showId);
      if(!show) {
        console.warn(`Unable to find ${showId}`);
      }
      return [showId, show];
    }).filter(s => s[1] !== null && typeof s[1] !== "undefined")
  )

  if(dev) console.debug(JSON.stringify(result, undefined, '\t'));

  return {
    result,
    shows,
    page,
    warnings,
    settings: {
      highlightVisibility: cookies.get("searchHighlightVisibility"),
    }
  }
}) satisfies PageServerLoad