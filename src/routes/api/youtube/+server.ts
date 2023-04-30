import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";

const scrapeCacheTime = 5000;
const apiCacheTime = 10 * 60e3; // 10 minutes

// not KV enforced because youtube can handle the tiny bit of extra traffic when the worker restarts
const lastLive = {
    lastCheck: 0,
    isLive: false,
}

// is KV enforced because workers basically never last more than 10 minutes
let liveTitle = {
    lastCheck: 0,
    isWAN: false
}

export const GET = (async ({platform, url, fetch}) => {

    const cache = platform?.env?.CACHE;
    if(!cache) throw error(503, "Cache not available");

    if(Date.now() - lastLive.lastCheck < scrapeCacheTime) {
        return json({
            cached: true,
            cachedTitle: false,
            lastFetch: lastLive.lastCheck,
            isLive: lastLive.isLive,
            isWAN: false
        })
    }

    lastLive.lastCheck = Date.now();

    const pageData = await fetch("https://www.youtube.com/linustechtips").then(r => r.text());

    const isLive = pageData.includes("\"iconType\":\"LIVE\"");

    lastLive.isLive = isLive;

    if(!isLive) {
        return json({
            isLive,
            isWAN: false
        })
    }

    if(Date.now() - liveTitle.lastCheck < apiCacheTime) {
        const newTitleData = await cache.get("wheniswan:youtube:title", {type: "json"})
        if(newTitleData) {
            liveTitle = newTitleData;
        }
    }

    if(Date.now() - liveTitle.lastCheck < apiCacheTime) {
        return json({
            cached: true,
            cachedTitle: true,
            lastFetch: liveTitle.lastCheck,
            isLive,
            isWAN: liveTitle.isWAN
        })
    }

    liveTitle.lastCheck = Date.now();

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

    if(liveData.items.length == 0) {
        lastLive.lastCheck = Date.now();
        lastLive.isLive = false;
    }

    const isWAN = liveData.items[0].snippet.title.includes("WAN");

    liveTitle.isWAN = isWAN;

    await cache.put("wheniswan:youtube:title", JSON.stringify(liveTitle));

    return json({
        isLive,
        isWAN
    })


}) satisfies RequestHandler;