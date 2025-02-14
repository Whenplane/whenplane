import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import type { DurableObjectNamespace, DurableObjectStub } from "@cloudflare/workers-types";
import type { FpLiveStatusResponse } from "$lib/utils.ts";
import { isNearWan } from "$lib/timeUtils.ts";
import { log } from "$lib/server/server-utils.ts";
import { createMFResponse } from "$lib/server/MfResponseConverter.ts";

let cache: {
  lastFetch: number,
  lastData?: FpLiveStatusResponse
} = {lastFetch: 0};

const fast_cache_time = 5 * 60 * 60e3;

let lastImminentNotifSend = 0;
let lastOtherStreamNotifSend = 0;


export const GET = (async ({fetch, url, platform, locals}) => {

  /*if(dev) return json({
    "cached": true,
    "lastFetch": 1715992785281,
    "isLive": true,
    "started": "2024-12-18T00:25:25.184Z",
    "isThumbnailNew": false,
    "title": "iPhones Are Undeleting Nudes?? - WAN Show May 17, 2024",
    "titleFirstSeen": "2024-05-18T00:20:15.333Z",
    "thumbnail": "https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/658708756715044_1715388246628.jpeg",
    "thumbnailFirstSeen": "2024-05-11T00:44:11.045Z",
    "thumbnailAge": 604530807,
    "thumbnailAgePretty": "6d 23h 55m 30s",
    "description": "<p>Visit <a href=\"https://www.squarespace.com/WAN\" rel=\"noopener noreferrer\" target=\"_blank\">https://www.squarespace.com/WAN</a> and use offer code WAN for 10% off</p><p><br></p><p>Improve your website’s SEO performance FOR FREE with Ahref’s Webmaster Tools. Check it out at <a href=\"https://ahrefs.com/awt\" rel=\"noopener noreferrer\" target=\"_blank\">https://ahrefs.com/awt</a>&nbsp;</p><p><br></p><p>Download the free Magical extension and save some precious time during your day to day grind at <a href=\"https://getmagical.com/WANshow\" rel=\"noopener noreferrer\" target=\"_blank\">https://getmagical.com/WANshow</a>.</p><p><br></p><p>Podcast Download: TBD</p><p><br></p>",
    "descriptionFirstSeen": "2024-05-17T23:27:05.516Z",
    "fetched": 1715992781000,
    "isWAN": true
  }) // */

  try {

    const fetcher: DurableObjectNamespace | undefined = platform?.env?.FLOATPLANE_FETCHER;

    const withDescription = url.searchParams.get("description") === "true";

    const cache_time = isNearWan() ? 4.999e3 : 29.999e3;

    const fast = url.searchParams.get("fast") === "true";
    const realCacheTime = fast ? fast_cache_time : cache_time;

    const cacheRequest = new Request("https://whenplane/floatplane");
    let cfCache;
    if(!cache.lastData) {
      if(typeof caches !== "undefined") {
        cfCache = await caches.open("whenplane:sessions");

        const cacheMatch = await cfCache.match(cacheRequest);

        if(cacheMatch) {
          const cacheTimeHeader = cacheMatch.headers.get("x-cache-time");
          if(!cacheTimeHeader) console.warn("Cached session data does not have cache time header!")
          const cachedTime = new Date(cacheTimeHeader ?? 0);
          if(Date.now() - cachedTime.getDate() < realCacheTime) {
            const data = await cacheMatch.json().then(r => r.data);
            cache = {
              lastFetch: cachedTime.getTime(),
              lastData: data
            };
            return data;
          }
        }
      } else {
        console.warn("Cache API is missing!")
      }
    }

    if(Date.now() - cache.lastFetch < realCacheTime && cache.lastData) {
      return json({
        cached: true,
        lastFetch: cache.lastFetch,
        ...cache.lastData,
        description: withDescription ? cache.lastData?.description : undefined,
        isWAN: cache.lastData?.title?.toLowerCase().includes(" wan ")
      });
    }

    cache.lastFetch = Date.now();

    let stub: DurableObjectStub;
    if(fetcher) {
      const id = fetcher.idFromName("floatplane");
      stub = fetcher.get(id, {locationHint: 'wnam'});
    } else if(dev) {
      stub = {fetch} as unknown as DurableObjectStub;
    } else {
      throw error(503, "Fetcher not available");
    }

    const doStart = Date.now();
    const response = await stub.fetch("https://floatplane-live-status.ajg.workers.dev/channel/linustechtips");
    locals.addTiming({id: 'doFetch', duration: Date.now() - doStart});


    const data: FpLiveStatusResponse = await response.json();
    const isWAN = data?.title?.includes("WAN")

    const quickNotificationThrottleTime = 3 * 60 * 60e3;

    const now = new Date();


    const throttler = (platform?.env?.NOTIFICATION_THROTTLER as DurableObjectNamespace)

    if(data.isThumbnailNew && throttler && Date.now() - lastImminentNotifSend > quickNotificationThrottleTime && (now.getUTCDay() >= 5 || now.getUTCDay() === 0)) {
      lastImminentNotifSend = Date.now();

      console.log("Sending wan imminent notification!");
      const id = throttler.idFromName("n");
      const stub = throttler.get(id);

      const params = new URLSearchParams();
      params.set("title", data.title);
      params.set("image", data.thumbnail);

      platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/imminent?" + params.toString()))
      // platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/test?" + params.toString()))
    } else if(!isWAN && data.isLive && throttler && Date.now() - lastOtherStreamNotifSend > quickNotificationThrottleTime) {
      lastOtherStreamNotifSend = Date.now();

      console.log("Sending other stream live notification!");
      const id = throttler.idFromName("n");
      const stub = throttler.get(id);

      const params = new URLSearchParams();
      params.set("title", data.title);
      params.set("image", data.thumbnail);

      platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/other_streams?" + params.toString()))
    }

    cache = {
      lastFetch: Date.now(),
      lastData: data
    }
    platform?.context?.waitUntil(
      cfCache?.put(cacheRequest, await createMFResponse(json(
        {
          data,
        },
        {
          headers: {
            "x-cache-time": new Date().toISOString()
          }
        }
      )) as Response));

    return json({
      ...data,
      description: withDescription ? data.description : undefined,
      isWAN: data.title?.toLowerCase().includes(" wan ")
    });


  } catch(e) {
    log(platform, "[/api/floatplane] Error thrown: " + e);
    throw e;
  }

})

export type FpEndpointResponse = FpLiveStatusResponse & {
  isWAN: boolean
}





/* old wandb stuff
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

  const quickNotificationThrottleTime = 3 * 60 * 60e3;

  const now = new Date();


  const throttler = (platform?.env?.NOTIFICATION_THROTTLER as DurableObjectNamespace)

  /*const params = new URLSearchParams();
  params.set("title", response.title+"");
  params.set("image", response.thumbnail+"");

  const id = throttler.idFromName("n");
  const stub = throttler.get(id);

  platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/test?" + params.toString())) *\/


  if(response.imminence === 3 && response.isWAN && throttler && Date.now() - lastNotifSend > quickNotificationThrottleTime && (now.getUTCDay() >= 5 || now.getUTCDay() === 0)) {
    lastNotifSend = Date.now();

    console.log("Sending wan imminent notification!");
    const id = throttler.idFromName("n");
    const stub = throttler.get(id);

    const params = new URLSearchParams();
    params.set("title", response.title+"");
    params.set("image", response.thumbnail+"");

    platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/imminent?" + params.toString()))
    // platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/test?" + params.toString()))
  } else if(!response.isWAN && response.live && throttler && Date.now() - lastNotifSend > quickNotificationThrottleTime) {
    lastNotifSend = Date.now();

    console.log("Sending other stream live notification!");
    const id = throttler.idFromName("n");
    const stub = throttler.get(id);

    const params = new URLSearchParams();
    params.set("title", response.title+"");
    params.set("image", response.thumbnail+"");

    platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/other_streams?" + params.toString()))
  }

  return json({
    ...response,
    via: "TheWanDB"
  });
}) satisfies RequestHandler;*/