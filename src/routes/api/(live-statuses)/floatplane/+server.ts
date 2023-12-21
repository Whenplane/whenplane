import { wait, type WanDb_FloatplaneData } from "$lib/utils.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { dev, version } from "$app/environment";

let cache: {
  lastFetch: number,
  lastData?: WanDb_FloatplaneData
} = {lastFetch: 0};

const cache_time = 5e3;
const fast_cache_time = 5 * 60 * 60e3;

export const GET = (async ({fetch, url}) => {
  const fast = url.searchParams.has("fast");
  if(Date.now() - cache.lastFetch < (fast ? fast_cache_time : cache_time)) {
    return json({
      cached: true,
      lastFetch: cache.lastFetch,
      ...cache.lastData,
      via: "TheWanDB"
    });
  }

  const responsePromise = fetch("https://edge.thewandb.com/v2/live/floatplane", {
    headers: {
      "referer": "whenplane.com",
      "x-whenplane-version": version
    }
  }).then(r => r.json() as Promise<WanDb_FloatplaneData>)
    .catch(error => {
      // retry in 30 seconds
      cache = {
        lastFetch: Date.now() - cache_time + 30e3
      }
      console.error("Error while fetching fp live status from thewandb:", error);
      return false;
    });
  // don't wait for more than 400ms for thewandb
  const response = await Promise.race([responsePromise, wait(dev ? 1000 : 400)]) as (WanDb_FloatplaneData & {wan?: boolean});
  if(!response) throw error(504);
  cache = {
    lastFetch: Date.now(),
    lastData: response
  }
  if(!response.isWAN) {
    response.isWAN = response.wan;
    delete response.wan;
  }

  return json({
    ...response,
    via: "TheWanDB"
  });
}) satisfies RequestHandler;