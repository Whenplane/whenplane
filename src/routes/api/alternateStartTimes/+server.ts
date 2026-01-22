import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1DatabaseSession } from "@cloudflare/workers-types";
import { retryD1 } from "$lib/utils.ts";
import { dev } from "$app/environment";

const cacheUrl = new URL("http://alternate-start-times");

let localFetched = 0;
let localCache: AlternateTimeRow[] | undefined = undefined;

export const GET = (async ({platform}) => {

  const db = platform?.env?.DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(Date.now() - localFetched < 5 * 60e3 && localCache !== undefined) {
    return json(localCache, {
      headers: {
        "cache-control": "max-age=30, public",
      }
    });
  }

  const cache = await platform?.caches.open("alternate-start-times");
  const cachedTimesResponse = await cache?.match(cacheUrl);

  // short dc cache to limit updates from instances in the same dc
  if(cachedTimesResponse) {
    const cached = new Date(cachedTimesResponse.headers.get("x-cached") ?? 0).getTime()
    if(Date.now() - cached < 30e3) {
      localFetched =
      localCache = await cachedTimesResponse.json();
      return json(localCache);
    }
  }

  if(dev) await createTables(db);

  const alternateTimes = await retryD1(() =>
    db.prepare("select * from alternate_times")
      .all<AlternateTimeRow>()
      .then(r =>
        r.results // sets days to undefined if null
          .map(t => ({...t, days: t.days ?? undefined}))
      )
  );

  localFetched = Date.now();
  localCache = alternateTimes;
  platform?.context?.waitUntil(cache?.put(cacheUrl, json(alternateTimes, {headers: {"x-cached": new Date().toISOString()}})));
  return json(alternateTimes, {
    headers: {
      "cache-control": "max-age=30, public",
    }
  });

}) satisfies RequestHandler;

function createTables(db: D1DatabaseSession) {
  return retryD1(() =>
    db.prepare("create table if not exists alternate_times (date text, days integer, hour integer, minute integer)")
      .run()
  )
}

export type AlternateTimeRow = {
  /** The date of the show (e.g., 2026/01/23) */
  date: string,
  /** The number of days to add to the show date (if it gets moved a day) e.g., 1 for 1 day later, -1 for 1 day earlier */
  days?: number | null,
  /** The hour of the show (24h format, in Vancouver time) */
  hour: number | null,
  /** The minute of the show (in Vancouver time) */
  minute: number | null
}