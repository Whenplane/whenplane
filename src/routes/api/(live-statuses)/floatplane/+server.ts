import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";


const notLiveCacheTime = 30e3; // When the twitch isn't live, maximum fetch from floatplane api once every 30 seconds
const liveCacheTime = 10e3; // When twitch is live (with wan), maximum fetch from floatplane api once every 10 seconds;

let fastCache: {
    lastFetch: number,
    lastFetchData: any
} = {
    lastFetch: 0,
    lastFetchData: {}
};

export const GET = (async ({fetch, platform, url}) => {

    const cache = platform?.env?.CACHE;
    if(!cache) throw error(503, "Cache not available");
    if(!platform?.context) throw error(503, "Request context not available!");

    const twitchIsWAN = (await fetch("/api/twitch?short").then(r => r.json())).isWAN;

    const cacheTime = twitchIsWAN ? liveCacheTime : notLiveCacheTime;

    if(Date.now() - fastCache.lastFetch > cacheTime) { // before refreshing, fetch cache from KV
        const newCache = await cache.get("wheniswan:floatplane:cache", {type: "json"});
        if(newCache) {
            fastCache = newCache;
        }
    }

    if(Date.now() - fastCache.lastFetch < cacheTime) {
        const fpResponse = fastCache.lastFetchData;
        const livestream = fpResponse.length != 0 ? fpResponse[0].liveStream : null;
        const fpData = url.searchParams.has("short") ? undefined : fastCache.lastFetchData;
        return json(
            {
                cached: true,
                lastFetch: fastCache.lastFetch,
                fpData,
                isLive: !!livestream,
                isWAN: (!!livestream && livestream.title.includes("WAN"))
            }
        )
    }

    const fpResponse = await fetch("https://www.floatplane.com/api/v3/creator/named?creatorURL[0]=linustechtips")
        .then(r => r.json());

    fastCache.lastFetch = Date.now();
    fastCache.lastFetchData = fpResponse;

    platform.context.waitUntil(cache.put("wheniswan:floatplane:cache", JSON.stringify(fastCache)));

    const livestream = fpResponse.length != 0 ? fpResponse[0].liveStream : null;

    const fpData = url.searchParams.has("short") ? undefined : fpResponse;

    const isLive = !!livestream;
    const isWAN = isLive && livestream.title.includes("WAN");

    return json(
        {
            fpData,
            isLive,
            isWAN
        }
    )

}) satisfies RequestHandler;