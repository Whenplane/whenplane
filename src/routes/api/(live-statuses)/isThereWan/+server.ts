import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import type { KVNamespace } from "@cloudflare/workers-types";
import { isNearWan } from "$lib/timeUtils.ts";
import { newResponse } from "$lib/utils.ts";
import { createMFResponse } from "$lib/server/MfResponseConverter";
import { dev } from "$app/environment";


const cache: {
  lastFetch: number,
  lastData?: IsThereWanResponse
} = {lastFetch: 0};

const cacheURL = "https://whenplane/api/isThereWan";

export const GET = (async ({platform, locals}) => {
  const meta: KVNamespace | undefined = platform?.env?.META;
  if(!meta) throw error(503, "meta not available");

  if(!platform?.caches) throw error(503, "Cache not available!");

  const cache_time = isNearWan() ? 9750 : 5 * 60e3; // just under 10 seconds on wan days, 5 minutes on non-wan days

  /*if(dev) {
    const response: IsThereWanResponse = {
      text: "WAN WAS supposed to start at <a href=\"https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw/community?lb=Ugkx4p78bEAbdtJeIL0YUj_ZCcoHXB-whC3D\" target=\"_blank\" rel=\"noopener\">1pm PST</a>, but then BuhDan said in Floatplane chat that they pushed it back to be 3.5 hours from 11:40am PST (when that message was sent) which means around 3pm PST. I have updated the countdown to reflect this time.",
      image: "https://images.ajg0702.us/dan-3.5-hr.png"
    }
    return json(response);
  }*/

  const cacheDistance = Date.now() - cache.lastFetch;
  if(cacheDistance < cache_time) {
    return json({
      ...cache.lastData,
      cached: true,
      lastFetch: cache.lastFetch,
      cacheDistance
    })
  }

  const cacheStart = Date.now();

  // apparently caches apply to the whole datacenter, and not just memory, so we use that too
  const cfCache = await platform.caches.open("whenplane:isThereWan");

  const cacheMatch = await cfCache.match(cacheURL) as Response | undefined;
  if(cacheMatch) {

    const responseGeneratedRaw = cacheMatch.headers.get("x-response-generated");

    if(responseGeneratedRaw) {
      const responseGenerated = new Date(responseGeneratedRaw);

      if(Date.now() - responseGenerated.getTime() < cache_time) {
        console.log("Responding with cached response! (is-there-wan)");
        locals.addTiming({id: "cf-cache", duration: Date.now() - cacheStart})
        return newResponse(cacheMatch, (headers) => {
          headers.set("x-whenplane-cf-cached", "true");
          return headers;
        });
      }
    }
  }

  locals.addTiming({id: "cf-cache", duration: Date.now() - cacheStart})

  cache.lastFetch = Date.now()

  const promises = await Promise.all([
    meta.get("is-there-wan"),
    meta.get("is-there-wan:image-url")
  ]);

  const response: IsThereWanResponse = {
    timestamp: Date.now(),
    text: promises[0],
    image: promises[1]
  }

  cache.lastData = response;

  const maxAge = Math.ceil(cache_time / 1e3);
  const jsonResponse = json(response, {
    headers: {
      "Cache-Control": `public max-age=${maxAge} s-maxage=${maxAge} must-revalidate`,
      "x-response-generated": new Date().toISOString()
    }
  });

  platform?.context?.waitUntil(cfCache.put(cacheURL, await createMFResponse(jsonResponse.clone()) as Response))

  return jsonResponse;
}) satisfies RequestHandler

export type IsThereWanResponse = {
  timestamp?: number,
  text: string | null
  image: string | null
}


