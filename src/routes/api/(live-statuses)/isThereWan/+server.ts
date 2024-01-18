import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import type { KVNamespace } from "@cloudflare/workers-types";
import { dev } from "$app/environment";

const CACHE_TIME = 4750;

const cache: {
  lastFetch: number,
  lastData?: IsThereWanResponse
} = {lastFetch: 0};

export const GET = (async ({platform}) => {
  const meta: KVNamespace = platform?.env?.META;
  if(!meta) throw error(503, "meta not available");

  /*if(dev) {
    const response: IsThereWanResponse = {
      text: "Linus will most likely be calling into the show today due to being at CES. This could lead to either the show being earlier than normal, or later than normal. <br><small>If you have further information, <i>please</i> let me know either on discord (ajgeiss0702) or email (<a href='mailto:aj@whenplane.com'>aj@whenplane.com</a>) so that I can publish it here</small>",
      image: null
    }
    return json(response);
  }*/

  const cacheDistance = Date.now() - cache.lastFetch;
  if(cacheDistance < CACHE_TIME) {
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

  return json(response);
}) satisfies RequestHandler

export type IsThereWanResponse = {
  text: string | null
  image: string | null
}