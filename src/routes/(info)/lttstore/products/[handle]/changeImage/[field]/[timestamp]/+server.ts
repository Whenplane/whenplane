import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { isNearWan } from "$lib/timeUtils.ts";
import { newResponse } from "$lib/utils.ts";

export const GET = (async ({params, platform}) => {

  const productId = Number(params.handle ?? "NaN");
  const field = params.field;
  const timestamp = Number(params.timestamp ?? "NaN");

  if(isNaN(timestamp) || isNaN(productId)) throw error(400);

  if(!platform?.caches) throw error(503, "Cache not available");

  const cacheKey = `${productId}/${field}/${timestamp}`;

  const cfCache = await platform.caches.open("whenplane:changeImages");

  const cache_time = 14 * 24 * 60 * 60e3;

  const cacheMatch = await cfCache.match(cacheKey) as Response | undefined;
  if(cacheMatch) {

    const responseGeneratedRaw = cacheMatch.headers.get("x-response-generated");

    if(responseGeneratedRaw) {
      const responseGeneratedNumber = Number(responseGeneratedRaw);
      const responseGenerated = new Date(isNaN(responseGeneratedNumber) ? responseGeneratedRaw : responseGeneratedNumber);

      if(Date.now() - responseGenerated.getTime() < cache_time) {
        console.log("Responding with cached response! (latenesses)")
        return newResponse(cacheMatch, (headers) => {
          headers.set("x-whenplane-cf-cached", "true");
          return headers;
        });
      }
    }
  }

  const cache = platform?.env?.LTTSTORE_CHANGE_IMAGES;
  if(!cache) return error(503, "Screenshot cache not available!");

  const {value: cached, metadata: cachedMeta} = await cache.getWithMetadata<{type: string, expires: number, generated: number}>(cacheKey, {type: "arrayBuffer"})
  if(cached) {
    const type = cachedMeta?.type ?? "image/png";
    platform.context?.waitUntil(cfCache.put(cacheKey, respond(cached, type, {"x-response-generated": cachedMeta?.generated+""})))
    return respond(cached, type);
  }

  const object = platform?.env?.LTTSTORE_CHANGE_SCREENSHOT;
  if(!object) throw error(503, "Screenshot object not available");

  const id = object.idFromName("yuh");
  const stub = object.get(id, {locationHint: "wnam"});

  const response = await stub.fetch(`http://screenshot/?productId=${productId}&timestamp=${timestamp}&field=${field}`);

  if(!response.ok) {
    return json(await response.json(), {
      status: response.status,
      statusText: response.statusText,
      headers: {...response.headers}
    });
  }

  const type = response.headers.get("content-type") ?? "image/png";
  const image = await response.arrayBuffer();

  const expires = Date.now() + cache_time
  platform.context?.waitUntil(cache.put(cacheKey, image, {
    metadata: {
      type,
      expires,
      generated: Date.now()
    },
    expiration: Math.ceil(expires / 1e3) // cache for 2 weeks
  }))

  platform.context?.waitUntil(cfCache.put(cacheKey, respond(image, type, {"x-response-generated": Date.now()+""})))

  return respond(image, type);


}) satisfies RequestHandler;

function respond(d: ArrayBuffer, type: string, extraHeaders: Record<string, string> = {}) {
  return new Response(d, {
    headers: {
      "Content-type": type,
      ...extraHeaders
    }
  })
}