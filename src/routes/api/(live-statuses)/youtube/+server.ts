import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import { getClosestWan, getUTCDate, isNearWan } from "$lib/timeUtils";
import { dev, version } from "$app/environment";
import type {KVNamespace, DurableObjectNamespace, DurableObjectStub} from "@cloudflare/workers-types";
import { newResponse, type OldShowMeta } from "$lib/utils";
import { env } from "$env/dynamic/private";
import { log } from "$lib/server/server-utils";
import type { AlternateTimeRow } from "../../alternateStartTimes/+server.ts";


const cache: {
    lastFetch: number,
    value?: YoutubeResponse
} = {
    lastFetch: 0
}

let savedStartTime: boolean | undefined = undefined;
let savedMeta: boolean | undefined = undefined;

let lastNotifSend = 0;


export const GET = (async ({platform, locals, url, fetch}) => {

    const fast = url.searchParams.get("fast") === "true";
    const cacheTime = fast ? (5 * 60 * 60e3) : (isNearWan() ? 4750 : 60e3); // Fetch from fetcher no more than once every (just under) 5 seconds on wan days, 60 seconds otherwise

    // if(new Date().getSeconds() > 50) return json({forcedDev: true,"isLive":false,"isWAN":true,"videoId":"KtSabkVT8y4","forced":false,"upcoming":true})
    // if(dev) return json({forcedDev: true,"isLive":true,"isWAN":true,"videoId":"KtSabkVT8y4","forced":false,"upcoming":false/*,"started":"1/17/2024"*/})

    const history: KVNamespace | undefined = platform?.env?.HISTORY;
    const fetcher: DurableObjectNamespace | undefined = platform?.env?.FETCHER;
    if(!history) throw error(503, "History not available");
    if(!platform?.context) throw error(503, "Request context not available!");

    const fetchDistance = Date.now() - cache.lastFetch;
    if(
        cache.value &&
        fetchDistance < cacheTime
    ) {
        return json({...cache.value, cached: true, fetchDistance});
    }

    let cCache: Cache | undefined = undefined;
    let cacheRequest: Request | undefined = undefined;
    if(typeof caches !== "undefined") {
        cCache = await caches.open("whenplane:youtube-DO-fetch");
        cacheRequest = new Request("https://cache/youtube");
        const cacheMatch = await cCache.match(cacheRequest);

        if(cacheMatch) {
            const fetched = cacheMatch.headers.get("x-fetched")
            if(fetched && Date.now() - new Date(fetched).getTime() < cacheTime) {
                return newResponse(cacheMatch);
            }
        }
    } else {
        console.warn("missing cache api!")
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
    let {isLive, isWAN, started, videoId, snippet, upcoming, scheduledStart} =
      await stub.fetch("https://wheniswan-fetcher.ajg.workers.dev/youtube")
        .then(r => r.json()) as DOResponse;
    locals.addTiming({id: 'doFetch', duration: Date.now() - doStart})

    const alternateStartTimes = await fetch("/api/alternateStartTimes?v=" + version)
      .then(r => r.json() as Promise<AlternateTimeRow[]>);

    if(!savedStartTime && isWAN && (started || !savedMeta)) {
        const closestWAN = getClosestWan(undefined, alternateStartTimes);
        const distance = Math.abs(Date.now() - closestWAN.getTime())
        // Only record show start time if we are within 7 hours of the closest wan
        if(distance < 7 * 60 * 60 * 1000) {
            platform.context.waitUntil((async () => {
                const kvMainShowStart = await history.get(getUTCDate(closestWAN) + ":mainShowStart");
                if(!kvMainShowStart) {
                    // Expire these keys after 15 days to save space over time.
                    // It should be collapsed into a single object at the end of the stream, so no data should be lost.
                    // The collapsing is done in a scheduled worker
                    const expirationTtl = 15 * 24 * 60 * 60
                    const date = getUTCDate(getClosestWan(undefined, alternateStartTimes));
                    if(started) await history.put(date + ":mainShowStart", started, {expirationTtl});
                    if(videoId) await history.put(date + ":videoId", videoId, {expirationTtl});
                    if(snippet) await history.put(date + ":snippet", JSON.stringify(snippet), {expirationTtl});
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
            if(started) savedStartTime = true;
            savedMeta = true;
        }
    }

    let forced = false;

    // ignore youtube saying that wan is still live even though it is no longer live (only if they've been live for more than 5 minutes)
    if(isWAN && started && Date.now() - new Date(started).getTime() > 10 * 60e3) {
        const twitchData = await fetch("/api/twitch?fast=true").then(r => r.json());
        isWAN = !!twitchData.isWAN;
        if(!isWAN) {
            log(platform, "Forcing youtube isWAN to false bc twitch is offline", JSON.stringify(twitchData));
            forced = true;
        }
    }


    const result: YoutubeResponse = {
        time: Date.now(),
        isLive,
        isWAN,
        started,
        videoId,
        forced,
        upcoming,
        scheduledStart
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

    /*if(!sentToWDB && isWAN && videoId) {
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
          ).catch()
        );
    }*/

    cache.value = result;
    if(cCache && cacheRequest) platform.context.waitUntil(cCache.put(cacheRequest, json(result, {headers: {"x-fetched": new Date().toISOString()}})));
    return json(result);

}) satisfies RequestHandler;

export type YoutubeResponse = {
    time: number,
    isLive: boolean,
    isWAN?: boolean,
    started?: string,
    videoId?: string,
    forced: boolean,
    upcoming: boolean,
    scheduledStart?: string
}

type DOResponse = {
    isLive: boolean,
    isWAN?: boolean,
    started?: string,
    videoId?: string,
    snippet?: OldShowMeta["snippet"],
    upcoming: boolean,
    scheduledStart?: string
}