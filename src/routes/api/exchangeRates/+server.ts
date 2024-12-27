import { error, json, type RequestHandler } from "@sveltejs/kit";
import { newResponse } from "$lib/utils.ts";
import type { LatestExchangeRate } from "./exchangeRateAPITypes.ts";
import { dev } from "$app/environment";
import { createMFResponse } from "$lib/server/MfResponseConverter";

const cacheURL = "https://whenplane/api/exchangeRates";

const setOrder = [
  "USD",
  "CAD",
  "GBP",
  "EUR"
];

let memCache: LatestExchangeRate;
let memCacheLastFetch = 0;

export const GET = (async ({platform, fetch, locals}) => {
  if(!platform?.caches) throw error(503, "Missing cache!");

  if(memCacheLastFetch > 0 && memCache && Date.now() <= memCache.time_next_update_unix*1e3 && Date.now() - memCacheLastFetch < 24 * 60 * 60e3) {
    return json(memCache);
  }

  const cacheStart = Date.now();

  const cfCache = await platform.caches.open("whenplane:exchangeRates");

  const cacheMatch = await cfCache.match(cacheURL) as Response | undefined;
  if(cacheMatch && !dev) {

    const responseGeneratedRaw = cacheMatch.headers.get("x-response-generated");

    if(responseGeneratedRaw) {
      const responseGenerated = new Date(responseGeneratedRaw);

      const cacheMatchData: LatestExchangeRate = await cacheMatch.clone().json();

      if((cacheMatchData.time_next_update_unix * 1e3) - responseGenerated.getTime() > 0) {
        const clonedResponse = cacheMatch.clone().json();
        platform.context?.waitUntil(async () => {
          memCache = await clonedResponse;
          memCacheLastFetch = responseGenerated.getTime();
        })
        console.log("Responding with cached response! (exchangeRates)");
        locals.addTiming({id: "cf-cache", duration: Date.now() - cacheStart})
        return newResponse(cacheMatch, (headers) => {
          headers.set("x-whenplane-cf-cached", "true");
          return headers;
        });
      }
    }
  }

  locals.addTiming({id: "cf-cache", duration: Date.now() - cacheStart})


  const response = await fetch("https://open.er-api.com/v6/latest/USD")
    .then(response => response.json()) as LatestExchangeRate;

  const setOrderRates = (() => {
    const rates = {};
    setOrder.toReversed().forEach(c => rates[c] = response.rates[c]);
    return Object.entries(rates);
  })()

  response.rates = Object.fromEntries(
    [
      ...Object.entries(
          {
            ...Object.fromEntries(Object.entries(response.rates).reverse()),
          }
        ),
      ...setOrderRates
    ]
        .reverse()
  )


  const maxAge = 12 * 60 * 60;
  const jsonResponse = json(response, {
    headers: {
      "Cache-Control": `public max-age=${maxAge} s-maxage=${maxAge} must-revalidate`,
      "x-response-generated": new Date().toISOString()
    }
  });

  memCache = response;
  memCacheLastFetch = Date.now();

  platform?.context?.waitUntil(cfCache.put(cacheURL, await createMFResponse(jsonResponse.clone()) as Response))

  return jsonResponse;

}) satisfies RequestHandler;

