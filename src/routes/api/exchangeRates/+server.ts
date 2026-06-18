import { error, json, type RequestHandler } from "@sveltejs/kit";
import { newResponse, retry } from "$lib/utils.ts";
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

let memCache: {[currency: string]: LatestExchangeRate} = {};
let memCacheLastFetch: {[currency: string]: number} = {};

export const GET = (async ({platform, fetch, locals, url}) => {
  if(!platform?.caches) throw error(503, "Missing cache!");

  const currency = url.searchParams.get("currency")?.toUpperCase() ?? "USD";
  if(!["USD", "CAD"].includes(currency)) {
    throw error(400, "Only CAD or USD can be requested. Please use https://www.exchangerate-api.com/docs/free directly if you want others!")
  }

  if(
    memCacheLastFetch[currency] && memCache[currency] &&
    Date.now() <= memCache[currency].time_next_update_unix*1e3 &&
    Date.now() - memCacheLastFetch[currency] < 24 * 60 * 60e3
  ) {
    return json(memCache[currency]);
  }

  const cacheStart = Date.now();

  const cfCache = await platform.caches.open("whenplane:exchangeRates:" + currency);

  const cacheMatch = await cfCache.match(cacheURL) as Response | undefined;
  if(cacheMatch && !dev) {

    const responseGeneratedRaw = cacheMatch.headers.get("x-response-generated");

    if(responseGeneratedRaw) {
      const responseGenerated = new Date(responseGeneratedRaw);

      const cacheMatchData: LatestExchangeRate = await cacheMatch.clone().json();

      if((cacheMatchData.time_next_update_unix * 1e3) - responseGenerated.getTime() > 0) {
        const clonedResponse = cacheMatch.clone().json();
        platform.context?.waitUntil(async () => {
          memCache[currency] = await clonedResponse;
          memCacheLastFetch[currency] = responseGenerated.getTime();
        })
        console.log(`Responding with cached ${currency} response! (exchangeRates)`);
        locals.addTiming({id: "cf-cache", duration: Date.now() - cacheStart})
        return newResponse(cacheMatch, (headers) => {
          headers.set("x-whenplane-cf-cached", "true");
          return headers;
        });
      }
    }
  }

  locals.addTiming({id: "cf-cache", duration: Date.now() - cacheStart})


  const response: LatestExchangeRate = await retry(() =>
    fetch("https://open.er-api.com/v6/latest/" + currency)
      .then(response => response.json())
  )
    .catch(() => {
      return {
        result: "success",
        provider: "local",
        time_last_update_unix: Date.now(),
        time_last_update_utc: new Date().toISOString(),
        time_next_update_unix: Date.now() + 5e3,
        time_next_update_utc: new Date(Date.now() + 5e3).toISOString(),
        time_eol_unix: 1894314516122,
        base_code: "USD",
        rates: {
          "USD": 1
        }
      }
    })

  const setOrderRates = (() => {
    const rates: {[c: string]: number} = {};
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

  memCache[currency] = response;
  memCacheLastFetch[currency] = Date.now();

  platform?.context?.waitUntil(cfCache.put(cacheURL, await createMFResponse(jsonResponse.clone()) as Response))

  return jsonResponse;

}) satisfies RequestHandler;

