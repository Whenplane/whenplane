import type { D1PreparedStatement, D1Result } from "@cloudflare/workers-types";
import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import { options, vote_valid_for } from "$lib/voting.ts";
import { dev } from "$app/environment";
import { latenessVotesCache } from "$lib/stores.ts";


const names = options.map(o => o.name);

// cache for (just under) 5 seconds to reduce requests to d1
const cache_time = 4750;

export const GET = (async ({platform, url}) => {

  const fast = url.searchParams.get("fast") === "true";

  if(latenessVotesCache.lastData && Date.now() - latenessVotesCache.lastFetch < cache_time || (fast && Date.now() - latenessVotesCache.lastFetch < 5 * 60 * 60e3)) {
    return json(latenessVotesCache.lastData);
  }
  latenessVotesCache.lastFetch = Date.now();

  const db = platform?.env?.DB;

  if(!db) throw error(503, "Database unavailable!");

  if(dev) {
    await db.prepare("create table if not exists lateness_votes (id STRING, timestamp INTEGER, vote STRING)").run();

    // const voteTotals = structuredClone(options);
    // for (let i = 0; i < 100; i++) {
    //   voteTotals[Math.floor(Math.random() * voteTotals.length)].votes += 1;
    // }
    // latenessVotesCache.lastData = voteTotals;
    // return json(voteTotals);
  }

  const utcDay = new Date().getUTCDay();

  const votes = (utcDay === 5 || utcDay === 6) ? await (db.prepare("select * from lateness_votes where timestamp > ? order by timestamp desc")
    .bind(Date.now() - vote_valid_for) as D1PreparedStatement)
    .all<{id: string, timestamp: string, vote: string}>()
    .then(r => r?.results) : [];

  const processedIds: string[] = [];

  const voteTotals = structuredClone(options);

  for (const vote of (votes ?? [])) {

    if(processedIds.includes(vote.id)) continue;
    processedIds.push(vote.id)

    const index = names.indexOf(vote.vote);
    if(index == -1 || !voteTotals[index]) {
      continue;
    }

    voteTotals[index].votes += 1;

  }

  latenessVotesCache.lastData = voteTotals;

  return json(voteTotals);

}) satisfies RequestHandler;