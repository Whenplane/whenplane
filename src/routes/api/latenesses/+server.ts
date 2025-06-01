import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import { isNearWan } from "$lib/timeUtils.ts";
import { newResponse } from "$lib/utils.ts";
import { createMFResponse } from "$lib/server/MfResponseConverter";


const cacheURL = "https://whenplane/api/latenesses";

let cache: {
  lastFetch: number,
  lastData?: Latenesses
} = {lastFetch: 0};

export const GET = (async ({platform, url}) => {

  const meta = platform?.env?.META;
  if(!meta) throw error(503, "Missing meta KV!");

  if(!platform?.caches) throw error(503, "Cache not available");

  const cfCache = await platform.caches.open("whenplane:latenesses");

  const fast = url.searchParams.get("fast") === "true";
  const cache_time = fast ? (5 * 60 * 60e3) : (isNearWan() ? 5 * 60e3 : 60 * 60e3);

  if(Date.now() - cache.lastFetch < cache_time && cache.lastData) {
    return respond(cache.lastData, cache_time);
  }

  const cacheMatch = await cfCache.match(cacheURL) as Response | undefined;
  if(cacheMatch) {

    const responseGeneratedRaw = cacheMatch.headers.get("x-response-generated");

    if(responseGeneratedRaw) {
      const responseGenerated = new Date(responseGeneratedRaw);

      if(Date.now() - responseGenerated.getTime() < cache_time) {
        console.log("Responding with cached response! (latenesses)")
        return newResponse(cacheMatch, (headers) => {
          headers.set("x-whenplane-cf-cached", "true");
          return headers;
        });
      }
    }
  }

  cache.lastFetch = Date.now();

  const averageLateness = meta.get("averageLateness", {type: 'json'}) as Promise<number>;
  const latenessStandardDeviation = meta.get("latenessStandardDeviation", {type: 'json'}) as Promise<number>;
  const medianLateness = meta.get("medianLateness", {type: 'json'}) as Promise<number>;

  const response: Latenesses = {
    averageLateness: await averageLateness,
    latenessStandardDeviation: await latenessStandardDeviation,
    medianLateness: await medianLateness
  }

  cache = {
    lastFetch: Date.now(),
    lastData: response
  }

  const jsonResponse = respond(response, cache_time);

  platform?.context?.waitUntil(cfCache.put(cacheURL, await createMFResponse(jsonResponse.clone()) as Response))

  return jsonResponse;

}) satisfies RequestHandler;

function respond(response: Latenesses, cache_time: number) {
  const maxAge = Math.ceil(cache_time / 1e3);
  return json(response, {
    headers: {
      "Cache-Control": `public max-age=${maxAge} s-maxage=${maxAge} must-revalidate`,
      "x-response-generated": new Date().toISOString()
    }
  });
}

export type Latenesses = {
  averageLateness?: number,
  latenessStandardDeviation?: number,
  medianLateness?: number
}