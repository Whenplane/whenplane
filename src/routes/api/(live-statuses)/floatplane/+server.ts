import { wait } from "$lib/utils.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { dev, version } from "$app/environment";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import type { WanDb_FloatplaneData } from "$lib/wdb_types.ts";

let cache: {
  lastFetch: number,
  lastData?: WanDb_FloatplaneData
} = {lastFetch: 0};

const cache_time = 5e3;
const fast_cache_time = 5 * 60 * 60e3;

let lastNotifSend = 0;

export const GET = (async ({fetch, url, platform}) => {
  const fast = url.searchParams.has("fast");
  if(Date.now() - cache.lastFetch < (fast ? fast_cache_time : cache_time)) {
    return json({
      cached: true,
      lastFetch: cache.lastFetch,
      ...cache.lastData,
      via: "TheWanDB"
    });
  }

  const endpoint = "https://edge.thewandb.com/v2/live/floatplane";
  // const endpoint = "https://edge.thewandb.com/v2/live/floatplane-test?im=3";

  const responsePromise = fetch(endpoint, {
    headers: {
      "referer": "whenplane.com",
      "x-whenplane-version": version,
      "user-agent": "Whenplane/" + version
    }
  })
    .then(r => r.json() as Promise<WanDb_FloatplaneData>)
    .then(r => {
      // cache response if we dont have it
      if(!cache.lastData && r) {
        cache = {
          lastFetch: Date.now(),
          lastData: typeof r["error"] == "undefined" ? r : cache.lastData
        }
      }

      return r;
    })
    .catch(error => {
      // retry in 30 seconds
      cache = {
        lastFetch: Date.now() - cache_time + 30e3,
        lastData: cache.lastData
      }
      console.error("Error while fetching fp live status from thewandb:", error);
      return false;
    });
  // don't wait for more than 400ms for thewandb
  const response = await Promise.race([responsePromise, wait(dev ? 1000 : 400)]) as (WanDb_FloatplaneData & {wan?: boolean});
  if(!response) {

    platform?.context?.waitUntil(responsePromise);

    // dont send cached response if there is no cached data or if the data is pretty old
    if(cache.lastData && Date.now() - cache.lastFetch < 60e3) {
      return json({
        cached: true,
        lastFetch: cache.lastFetch,
        cacheReason: "error",
        ...cache.lastData,
        via: "TheWanDB"
      });
    } else {
      throw error(504);
    }
  }
  cache = {
    lastFetch: typeof response["error"] == "undefined" ? Date.now() : Date.now() + 15e3, // dont fetch for an extra 15 seconds if the response has an error
    lastData: typeof response["error"] == "undefined" ? response : cache.lastData
  }
  if(!response.isWAN) {
    response.isWAN = response.wan;
    delete response.wan;
  }

  const throttler = (platform?.env?.NOTIFICATION_THROTTLER as DurableObjectNamespace)
  if(response.imminence === 3 && response.isWAN && throttler && Date.now() - lastNotifSend > (60 * 60e3)) {
    lastNotifSend = Date.now();

    console.log("Sending notification!");
    const id = throttler.idFromName("n");
    const stub = throttler.get(id);

    platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/imminent"))
  } else {
    console.log("Not sending notification", response.imminence, throttler, (Date.now() - lastNotifSend) / 1e3);
  }

  return json({
    ...response,
    via: "TheWanDB"
  });
}) satisfies RequestHandler;