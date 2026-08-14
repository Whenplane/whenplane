import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database, D1DatabaseSession } from "@cloudflare/workers-types";
import { retryD1 } from "$lib/utils.ts";
import { dev } from "$app/environment";
import { createMFResponse } from "$lib/server/MfResponseConverter.ts";
import { isNearWan } from "$lib/timeUtils.ts";

const cacheUrl = new URL("http://alternate-start-times").toString();

let localFetched = 0;
let localCache: AlternateTimeRow[] | undefined = undefined;

export const GET = (async ({platform}) => {

  const db = platform?.env?.DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  // 2 hours cache time when not near wan, 30 minutes when near wan
  const cache_time = isNearWan() ? 30 * 60e3 : 2 * 60 * 60e3;

  if(Date.now() - localFetched < cache_time && localCache !== undefined) {
    return json(localCache, {
      headers: {
        "cache-control": `public, max-age=${Math.floor(cache_time / 1e3)}`,
      }
    });
  }

  const cache = await platform?.caches?.open("alternate-start-times-1");
  const cachedTimesResponse = await cache?.match(cacheUrl);

  if(cache && cachedTimesResponse) {
    const cached = new Date(cachedTimesResponse.headers.get("x-cached") ?? 0).getTime();
    // set these even if its old, that way we can return it below if we get a d1 error
    localFetched = cached;
    localCache = await cachedTimesResponse.json();
    if(Date.now() - cached < cache_time) {
      return json(localCache, {
        headers: {
          "cache-control": `public, max-age=${Math.floor(cache_time / 1e3)}`,
        }
      });
    }
  }

  if(dev) await _createTables(db);

  try {

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
    platform?.context?.waitUntil(cache?.put(cacheUrl, await createMFResponse(json(alternateTimes, {headers: {"x-cached": new Date().toISOString()}}))));

    return json(alternateTimes, {
      headers: {
        "cache-control": `public, max-age=${Math.floor(cache_time / 1e3)}`,
      }
    });

  } catch(e) {
    // return cached value (if possible) when d1 errors
    if(localCache) {
      return json(localCache, {
        headers: {
          "cache-control": `public, max-age=${Math.floor(cache_time / 1e3)}`,
        }
      });
    }

    // throw the error if we have no cached value
    throw e;
  }

}) satisfies RequestHandler;

export function _createTables(db: D1DatabaseSession | D1Database) {
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