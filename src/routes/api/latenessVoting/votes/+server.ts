import type { D1PreparedStatement, D1Result } from "@cloudflare/workers-types";
import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import { type LatenessVotingOption, options, vote_valid_for } from "$lib/voting.ts";
import { dev } from "$app/environment";


const names = options.map(o => o.name);

// cache for (just under) 5 seconds to reduce requests to d1
const cache_time = 4750;
const cache: {
  lastFetch: number,
  lastData?: LatenessVotingOption[]
} = {lastFetch: 0}

export const GET = (async ({platform, url}) => {

  const fast = url.searchParams.get("fast") === "true";

  if(Date.now() - cache.lastFetch < cache_time || (fast && Date.now() - cache.lastFetch < 5 * 60 * 60e3)) {
    return json(cache.lastData);
  }
  cache.lastFetch = Date.now();

  const db = platform?.env?.DB;

  if(!db) throw error(503, "Database unavailable!");

  if(dev) {
    await db.prepare("create table if not exists lateness_votes (id STRING, timestamp INTEGER, vote STRING)").run();

    // const voteTotals = structuredClone(options);
    // for (let i = 0; i < 100; i++) {
    //   voteTotals[Math.floor(Math.random() * voteTotals.length)].votes += 1;
    // }
    // cache.lastData = voteTotals;
    // return json(voteTotals);
  }

  const votes = await (db.prepare("select * from lateness_votes where timestamp > ? order by timestamp desc")
    .bind(Date.now() - vote_valid_for) as D1PreparedStatement)
    .all() as unknown as D1Result<{id: string, timestamp: string, vote: string}>;

  const processedIds: string[] = [];

  const voteTotals = structuredClone(options);

  for (const vote of (votes.results ?? [])) {

    if(processedIds.includes(vote.id)) continue;
    processedIds.push(vote.id)

    const index = names.indexOf(vote.vote);
    if(index == -1 || !voteTotals[index]) {
      continue;
    }

    voteTotals[index].votes += 1;

  }

  cache.lastData = voteTotals;

  return json(voteTotals);

}) satisfies RequestHandler;