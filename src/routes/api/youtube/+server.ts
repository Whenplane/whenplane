import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";
import {dev} from "$app/environment";
import {getClosestWan, getUTCDate} from "$lib/timeUtils";

const scrapeCacheTime = 5000;
const apiCacheTime = dev ? 60 * 60e3 : 30 * 60e3; // 30 minutes (1 hour on dev)

let scrapeCache = {
    lastCheck: 0,
    liveCount: 0,
    isLive: false,
}

// is KV enforced because workers might not last the full cache time
let apiCache: {
    lastCheck: number,
    liveCount?: number,
    isWAN: boolean,
    started?: string
} = {
    lastCheck: 0,
    isWAN: false
}

let savedStartTime: boolean | undefined = undefined;

export const GET = (async ({platform, fetch, url}) => {

    const cache = platform?.env?.CACHE;
    const history = platform?.env?.HISTORY;
    if(!cache) throw error(503, "Cache not available");
    if(!history) throw error(503, "History not available");
    if(!platform?.context) throw error(503, "Request context not available!");


    if(Date.now() - scrapeCache.lastCheck < scrapeCacheTime) {
        const newLiveData = await cache.get("wheniswan:youtube:live", {type: "json"})
        if(newLiveData) {
            scrapeCache = newLiveData;
        }
    }

    const fast = url.searchParams.get("fast") === "true";

    // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
    if(Date.now() - scrapeCache.lastCheck < scrapeCacheTime || (fast && Date.now() - scrapeCache.lastCheck < 5 * 60 * 60e3)) {
        return json({
            cached: true,
            cachedTitle: false,
            lastFetch: scrapeCache.lastCheck,
            isLive: scrapeCache.isLive,
            isWAN: scrapeCache.isLive && apiCache.isWAN,
            started: scrapeCache.isLive ? apiCache.started : undefined
        })
    }

    scrapeCache.lastCheck = Date.now();

    // We use the live path because it appears to be smaller than the main channel page
    const pageData = await fetch("https://www.youtube.com/linustechtips/streams").then(r => r.text());

    const liveCount = (pageData.match(/"iconType":"LIVE"/g) || []).length
    const isLive = liveCount > 0;

    scrapeCache.liveCount = liveCount;
    scrapeCache.isLive = isLive;

    platform.context.waitUntil(cache.put("wheniswan:youtube:live", JSON.stringify(scrapeCache)));

    if(!isLive) {
        savedStartTime = false;
        return json({
            isLive,
            isWAN: false
        })
    }

    if(Date.now() - apiCache.lastCheck < apiCacheTime && scrapeCache.liveCount == (apiCache.liveCount || 0)) {
        const newTitleData = await cache.get("wheniswan:youtube:title", {type: "json"})
        if(newTitleData) {
            apiCache = newTitleData;
        }
    }

    if(Date.now() - apiCache.lastCheck < apiCacheTime && scrapeCache.liveCount == (apiCache.liveCount || 0)) {
        return json({
            cached: true,
            cachedTitle: true,
            lastFetch: apiCache.lastCheck,
            isLive,
            isWAN: apiCache.isWAN,
            started: apiCache.started
        })
    }

    apiCache.lastCheck = Date.now();

    const liveData = await fetch(
        "https://www.googleapis.com/youtube/v3/search" +
        "?part=snippet" +
        "&channelId=UCXuqSBlHAE6Xw-yeJA0Tunw" +
        "&maxResults=1" +
        "&order=date" +
        "&type=video" +
        "&eventType=live" +
        "&key=" + env.YOUTUBE_KEY
    ).then(r => r.json());

    const items = liveData?.items;
    if(!items || items.length < 1) {
        console.error("No items in ", liveData);
    }

    apiCache.liveCount = items.length;

    let isWAN;
    let videoId;

    for (const item of items) {
        isWAN = item.snippet.title.includes("WAN");
        videoId = item.id?.videoId
        if(isWAN) break;
    }

    if(!videoId) console.error("No id in ", liveData)

    if(liveData.items.length == 0) {
        scrapeCache.lastCheck = Date.now();
        scrapeCache.isLive = false;
    }

    const specificData = await fetch("https://www.googleapis.com/youtube/v3/videos" +
        "?part=liveStreamingDetails" +
        "&id=" + videoId +
        "&maxResults=1" +
        "&order=date" +
        "&type=video" +
        "&eventType=live" +
        "&key=" + env.YOUTUBE_KEY
    ).then(r => r.json())

    const started = specificData.items[0].liveStreamingDetails.actualStartTime;

    if(!savedStartTime && isWAN) {
        const closestWAN = getClosestWan();
        const distance = Math.abs(Date.now() - closestWAN.getTime())
        // Only record preshow start time if we are within 7 hours of the closest wan
        if(distance < 7 * 60 * 60 * 1000) {
            platform.context.waitUntil((async () => {
                const kvStartTime = await history.get(getUTCDate(closestWAN) + ":mainShowStart");
                if(!kvStartTime) {
                    await history.put(getUTCDate(getClosestWan()) + ":mainShowStart", started, {
                        // Expire this key after 15 days to save space over time.
                        // It should be collapsed into a single object at the end of the stream, so no data should be lost.\
                        // The collapsing is done in a scheduled worker
                        expirationTtl: 15 * 24 * 60 * 60
                    });
                }
            })());
            savedStartTime = true;
        }
    }

    apiCache.isWAN = isWAN;
    apiCache.started = started;

    platform.context.waitUntil(cache.put("wheniswan:youtube:title", JSON.stringify(apiCache)));

    return json({
        isLive,
        isWAN,
        started
    })


}) satisfies RequestHandler;