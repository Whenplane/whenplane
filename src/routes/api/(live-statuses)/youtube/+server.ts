import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import { getClosestWan, getUTCDate, isNearWan } from "$lib/timeUtils";
import { dev, version } from "$app/environment";
import type {KVNamespace, DurableObjectNamespace, DurableObjectStub} from "@cloudflare/workers-types";
import type {OldShowMeta} from "$lib/utils";
import { env } from "$env/dynamic/private";


const cache: {
    lastFetch: number,
    value?: YoutubeResponse
} = {
    lastFetch: 0
}

let savedStartTime: boolean | undefined = undefined;

let lastNotifSend = 0;

let sentToWDB = false;

export const GET = (async ({platform, locals, url, fetch}) => {

    const cacheTime = isNearWan() ? 4750 : 60e3; // Fetch from fetcher no more than once every (just under) 5 seconds on wan days, 60 seconds otherwise

    // if(new Date().getSeconds() > 50) return json({forcedDev: true,"isLive":false,"isWAN":true,"videoId":"KtSabkVT8y4","forced":false,"upcoming":true})
    // if(dev) return json({forcedDev: true,"isLive":true,"isWAN":true,"videoId":"KtSabkVT8y4","forced":false,"upcoming":false/*,"started":"1/17/2024"*/})

    const history: KVNamespace | undefined = platform?.env?.HISTORY;
    const fetcher: DurableObjectNamespace | undefined = platform?.env?.FETCHER;
    if(!history) throw error(503, "History not available");
    if(!platform?.context) throw error(503, "Request context not available!");

    const fast = url.searchParams.get("fast") === "true";

    const fetchDistance = Date.now() - cache.lastFetch;
    if(
        fetchDistance < cacheTime ||
        // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
        (fast && cache.value && fetchDistance < 5 * 60 * 60e3)
    ) {
        return json({...cache.value, cached: true, fetchDistance});
    }

    cache.lastFetch = Date.now();

    let stub: DurableObjectStub;
    if(fetcher) {
        const id = fetcher.idFromName("youtube");
        stub = fetcher.get(id, {locationHint: 'wnam'});
    } else if(dev) {
        stub = {fetch} as unknown as DurableObjectStub;
    } else {
        throw error(503, "Fetcher not available");
    }

    const doStart = Date.now();
    // eslint-disable-next-line prefer-const
    let {isLive, isWAN, started, videoId, snippet, upcoming} =
      await stub.fetch("https://wheniswan-fetcher.ajg.workers.dev/youtube")
        .then(r => r.json()) as DOResponse;
    locals.addTiming({id: 'doFetch', duration: Date.now() - doStart})

    if(!savedStartTime && isWAN && started) {
        const closestWAN = getClosestWan();
        const distance = Math.abs(Date.now() - closestWAN.getTime())
        // Only record show start time if we are within 7 hours of the closest wan
        if(distance < 7 * 60 * 60 * 1000) {
            platform.context.waitUntil((async () => {
                const kvStartTime = await history.get(getUTCDate(closestWAN) + ":mainShowStart");
                if(!kvStartTime) {
                    // Expire these keys after 15 days to save space over time.
                    // It should be collapsed into a single object at the end of the stream, so no data should be lost.
                    // The collapsing is done in a scheduled worker
                    const expirationTtl = 15 * 24 * 60 * 60
                    const date = getUTCDate(getClosestWan());
                    if(started) await history.put(date + ":mainShowStart", started, {expirationTtl});
                    if(videoId) await history.put(date + ":videoId", videoId, {expirationTtl});
                    await history.put(date + ":snippet", JSON.stringify(snippet), {expirationTtl});
                    await fetch("https://wheniswan-taskrunner.ajg.workers.dev/", {
                        method: "POST",
                        headers: {
                            "content-type": "application/json"
                        },
                        body: JSON.stringify({
                            key: env.TASKRUNNER_START_KEY
                        })
                    })
                }
            })());
            savedStartTime = true;
        }
    }

    let forced = false;

    // ignore youtube saying that wan is still live even though it is no longer live
    if(isWAN) {
        isWAN = await fetch("/api/twitch?fast=true").then(r => r.json())
          .then(d => !!d.isWAN);
        if(!isWAN) forced = true;
    }


    const result: YoutubeResponse = {
        time: Date.now(),
        isLive,
        isWAN,
        started,
        videoId,
        forced,
        upcoming
    };

    const throttler = (platform?.env?.NOTIFICATION_THROTTLER as DurableObjectNamespace)
    if(isLive && isWAN && throttler && Date.now() - lastNotifSend > (60 * 60e3)) {
        lastNotifSend = Date.now();
        const id = throttler.idFromName("n");
        const stub = throttler.get(id);

        const params = new URLSearchParams();
        params.set("title", snippet?.title+"");
        params.set("image", (snippet?.thumbnails.maxres ?? snippet?.thumbnails.default)+"");

        platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/mainshow_live?" + params.toString()))
    }

    if(!sentToWDB && isWAN && videoId) {
        sentToWDB = true;
        platform?.context?.waitUntil(
          fetch(
            `https://mq.thewandb.com/yt/${videoId}`,
            {
                method: "POST",
                headers: {
                    "referer": "whenplane.com",
                    "x-whenplane-version": version,
                    "user-agent": "Whenplane/" + version,
                    "content-type": "application/json"
                },
                body: JSON.stringify(result)
            }
          )
        );
    }

    cache.value = result

    return json(result)

}) satisfies RequestHandler;

export type YoutubeResponse = {
    time: number,
    isLive: boolean,
    isWAN?: boolean,
    started?: string,
    videoId?: string,
    forced: boolean,
    upcoming: boolean
}

type DOResponse = {
    isLive: boolean,
    isWAN?: boolean,
    started?: string,
    videoId?: string,
    snippet?: OldShowMeta["snippet"],
    upcoming: boolean
}