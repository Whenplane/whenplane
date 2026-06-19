import { json, redirect } from "@sveltejs/kit";
import { getStoreMetadata, Store, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import type { LayoutServerLoad } from "./$types";
import { createMFResponse } from "$lib/server/MfResponseConverter.ts";

let similarBatchCache: {batchSize: number, products: number} | undefined = undefined;
let similarBatchLastFetch = 0;

const CACHE_SECONDS = 24 * 60 * 60;

const cacheURL = "https://whenplane/lttstore/similarBatch";

export const load = (async ({params, url, fetch, cookies, platform, locals}) => {
  const storeId = storeIdFromName(params.store);
  if(storeId === -1) {
    const newUrl = new URL(url);
    if(url.pathname.includes("tempGlobal")) {
      newUrl.pathname = newUrl.pathname.replaceAll("tempGlobal", "global/products");
    } else {
      newUrl.pathname = newUrl.pathname.replace(/^\/lttstore/, "/lttstore/us");
      throw redirect(302, newUrl)
    }
  }

  const defaultCurrency = storeId === Store.US ? "USD" : "CAD";

  let similarBatch: {batchSize: number, products: number} | undefined = undefined;
  if(similarBatchCache && Date.now() - similarBatchLastFetch < CACHE_SECONDS * 1e3) {
    similarBatch = similarBatchCache;
  } else {
    const cacheStart = Date.now();
    const cfCache = await platform?.caches.open("whenplane:similarBatch");

    const cacheMatch = await cfCache?.match(cacheURL) as Response | undefined;
    if(cacheMatch) {
      const responseGeneratedRaw = cacheMatch.headers.get("x-response-generated");

      if(responseGeneratedRaw) {
        const responseGenerated = new Date(responseGeneratedRaw);

        if(Date.now() - responseGenerated.getTime() < CACHE_SECONDS * 1e3) {
          locals.addTiming({id: "sb-cf-cache", duration: Date.now() - cacheStart})
          const existing = await cacheMatch.json()
            .catch(() => false);
          if(existing && existing.batchSize && existing.products) {
            similarBatch = existing;
            similarBatchCache = existing;
            similarBatchLastFetch = responseGenerated.getTime();
          }
        }
      }
    }

    if(!similarBatch) {
      similarBatch = await platform?.env?.META
        .get(
          "similar-lttstore-products-batch-size",
          {
            type: "json",
            // subtract a minute to make sure KV's cache has expired by the time ours does
            cacheTtl: CACHE_SECONDS - 60
          }
        )
        ?? undefined;
      if(similarBatch && similarBatch.batchSize && similarBatch.products) {
        similarBatchLastFetch = Date.now();
        if(cfCache) {
          const jsonResponse = json(similarBatch, {
            headers: {
              "Cache-Control": `public max-age=${CACHE_SECONDS} s-maxage=${CACHE_SECONDS} must-revalidate`,
              "x-response-generated": new Date().toISOString()
            }
          });

          platform?.context?.waitUntil(cfCache.put(cacheURL, await createMFResponse(jsonResponse) as Response))
        }
      } else {
        // invalid similar batch from kv, retry in 60 seconds if we have existing cache data.
        // if no cache data, it will be retried on next request
        similarBatchLastFetch = Date.now() - (CACHE_SECONDS * 1e3) + 60e3;
      }
    }
  }

  return {
    exchangeRates: await fetch("/api/exchangeRates?currency=" + defaultCurrency).then(r => r.json()),
    currency: cookies.get("currency") ?? defaultCurrency,
    store: {
      id: storeId,
      ...getStoreMetadata(storeId),
      defaultCurrency
    },
    similarBatch
  }
}) satisfies LayoutServerLoad