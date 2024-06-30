import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import type { KVNamespace } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import { isNearWan } from "$lib/timeUtils.ts";


const cache: {
  lastFetch: number,
  lastData?: IsThereWanResponse
} = {lastFetch: 0};

const cacheURL = "https://whenplane/api/isThereWan"

export const GET = (async ({platform}) => {
  const meta: KVNamespace = platform?.env?.META;
  if(!meta) throw error(503, "meta not available");

  // apparently caches apply to the whole datacenter, and not just memory, so we use that too
  const cfCache = await caches.open("whenplane:is-there-wan");

  const cacheMatch = await cfCache.match(cacheURL);
  if(cacheMatch) {
    cacheMatch.headers.set("x-whenplane-cf-cached", "true");
    return cacheMatch;
  }


  const cache_time = isNearWan() ? 9750 : 5 * 60e3; // just under 10 seconds on wan days, 5 minutes on non-wan days

  /*if(dev) {
    const response: IsThereWanResponse = {
      text: "Linus will most likely be calling into the show today due to being at CES. This could lead to either the show being earlier than normal, or later than normal. <br><small>If you have further information, <i>please</i> let me know either on discord (ajgeiss0702) or email (<a href='mailto:aj@whenplane.com'>aj@whenplane.com</a>) so that I can publish it here</small>",
      image: null
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

  cache.lastFetch = Date.now()

  const promises = await Promise.all([
    meta.get("is-there-wan"),
    meta.get("is-there-wan:image-url")
  ]);

  const response: IsThereWanResponse = {
    text: promises[0],
    image: promises[1]
  }

  cache.lastData = response;

  const jsonResponse = json(response, {
    headers: {
      "Cache-Control": "public max-age=" + Math.ceil(cache_time / 1e3) + " must-revalidate"
    }
  });

  platform?.context?.waitUntil(cfCache.put(cacheURL, jsonResponse))

  return jsonResponse;
}) satisfies RequestHandler

export type IsThereWanResponse = {
  text: string | null
  image: string | null
}