import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import { isNearWan } from "$lib/timeUtils.ts";
import { newResponse } from "$lib/utils.ts";
import { createMFResponse } from "$lib/server/MfResponseConverter";


const cacheURL = "https://whenplane/api/latenesses";

export const GET = (async ({platform}) => {

  const meta = platform?.env?.META;
  if(!meta) throw error(503, "Missing meta KV!");

  if(!platform?.caches) throw error(503, "Cache not available");

  const cfCache = await platform.caches.open("whenplane:latenesses");

  const cache_time = isNearWan() ? 5 * 60e3 : 60 * 60e3;

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

  const averageLateness = meta.get("averageLateness", {type: 'json'}) as Promise<number>;
  const latenessStandardDeviation = meta.get("latenessStandardDeviation", {type: 'json'}) as Promise<number>;
  const medianLateness = meta.get("medianLateness", {type: 'json'}) as Promise<number>;

  const response: Latenesses = {
    averageLateness: await averageLateness,
    latenessStandardDeviation: await latenessStandardDeviation,
    medianLateness: await medianLateness
  }

  const maxAge = Math.ceil(cache_time / 1e3);
  const jsonResponse = json(response, {
    headers: {
      "Cache-Control": `public max-age=${maxAge} s-maxage=${maxAge} must-revalidate`,
      "x-response-generated": new Date().toISOString()
    }
  });

  platform?.context?.waitUntil(cfCache.put(cacheURL, await createMFResponse(jsonResponse.clone()) as Response))

  return jsonResponse;

}) satisfies RequestHandler;

export type Latenesses = {
  averageLateness?: number,
  latenessStandardDeviation?: number,
  medianLateness?: number
}