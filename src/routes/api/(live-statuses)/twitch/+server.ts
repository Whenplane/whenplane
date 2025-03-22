import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";
import { dev, version } from "$app/environment";
import { getClosestWan, getUTCDate, isNearWan } from "$lib/timeUtils";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import type { GetStreamsResponse } from "ts-twitch-api";
import type { TwitchToken } from "$lib/utils.ts";
import { twitchTokenCache } from "$lib/stores.ts";
import { log } from "$lib/server/server-utils.ts";

const cacheTime = 5000; // maximum fetch from twitch api once every 5 seconds

const makeAlwaysWAN = dev;

let savedStartTime: boolean | undefined = undefined;
let savedEndTime: boolean | undefined = undefined;

const fastCache: {
    lastFetch: number,
    lastFetchData?: GetStreamsResponse
} = {
    lastFetch: 0,
    lastFetchData: undefined
};

let lastNotifSend = 0;

export const GET = (async ({platform, url}) => {

    const cache = platform?.env?.CACHE;
    const history = platform?.env?.HISTORY;
    if(!cache) throw error(503, "Cache not available");
    if(!history) throw error(503, "History not available");
    if(!platform?.context) throw error(503, "Request context not available!");

    if(!env.TWITCH_CLIENT_ID) throw error(503, "Missing twitch client id!");
    if(!env.TWITCH_SECRET) throw error(503, "Missing twitch client secret!");

    const fast = url.searchParams.get("fast") === "true";

    // console.debug(1)
    const cachedIsLive = fastCache.lastFetchData?.data?.length != 0;
    const cachedTitle = fastCache.lastFetchData?.data[0]?.title;
    const cachedIsWAN = cachedIsLive && (cachedTitle?.includes("WAN") || makeAlwaysWAN);

    // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
    if(Date.now() - fastCache.lastFetch < cacheTime || (fast && Date.now() - fastCache.lastFetch < 5 * 60 * 60e3 && (!cachedIsLive || (cachedIsLive && cachedTitle)))) {
        const isLive = cachedIsLive;
        const isWAN = cachedIsWAN;
        const title = cachedTitle;

        const twitchData = url.searchParams.has("short") ? undefined : fastCache.lastFetchData;
        const started = isLive ? fastCache.lastFetchData?.data[0].started_at : undefined;

        return json(
            {
                cached: true,
                lastFetch: fastCache.lastFetch,
                twitchData,
                isLive,
                isWAN,
                started,
                title
            }
        )
    }

    let cCache: Cache | undefined = undefined;
    let cacheRequest: Request | undefined = undefined;
    if(typeof caches !== "undefined") {
        cCache = await caches.open("whenplane:twitch-fetch");
        cacheRequest = new Request("https://cache/twitch");
        const cacheMatch = await cCache.match(cacheRequest);

        if(cacheMatch) {
            const expires = cacheMatch.headers.get("expires")
            if(!expires || new Date(expires).getTime() > Date.now()) {
                return cacheMatch.clone();
            }
        }
    } else {
        console.warn("missing cache api!")
    }

    fastCache.lastFetch = Date.now();
    // console.debug(2)

    if(twitchTokenCache.token.validUntil < Date.now()) {
        const newToken = await cache.get<TwitchToken>("wheniswan:twitch:token", {type: "json"});
        if(newToken) {
            twitchTokenCache.token = newToken;
        }
    }

    if(twitchTokenCache.token.validUntil < Date.now()) {
        const details: {[key: string]: string} = {
            'client_id': env.TWITCH_CLIENT_ID,
            'client_secret': env.TWITCH_SECRET,
            'grant_type': 'client_credentials'
        };

        let formBody: string | string[] = [];
        for (const property in details) {
            const encodedKey = encodeURIComponent(property);
            const encodedValue = encodeURIComponent(details[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        const {access_token, expires_in, message} = await fetch(
            "https://id.twitch.tv/oauth2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formBody
            }
        ).then(r => r.json());

        if(message) console.warn("Got message in twitch response while getting token: ", message)

        console.log("Got access token: ", (access_token ? access_token.substring(0, 2) : access_token))

        twitchTokenCache.token = {
            token: access_token,
            validUntil: Date.now() + (expires_in * 1000) - 30e3, // fetch new token 30 seconds before it's supposed to expire,
            dateGenerated: Date.now()
        }
        platform.context.waitUntil(cache.put("wheniswan:twitch:token", JSON.stringify(twitchTokenCache.token)))
    }

    // console.debug(3)

    const twitchResponse = await fetch(
        "https://api.twitch.tv/helix/streams?user_login=linustech",
        {
            headers: {
                "Client-ID": env.TWITCH_CLIENT_ID,
                "Authorization": "Bearer " + twitchTokenCache.token.token,
                "referer": "whenplane.com",
                "x-whenplane-version": version,
                "user-agent": "Whenplane/" + version
            }
        }
    )

    const twitchJSON = await twitchResponse.json();

    // console.debug(4)

    if(twitchJSON.message) {
        console.warn("Got message in twitch response: ", twitchJSON.message)
        if(platform?.env?.LOG_MESSAGES) {
            platform.context.waitUntil((async () => {
                await platform.env?.LOG_MESSAGES.writeDataPoint({
                    blobs: ["Got message in twitch response: " + twitchJSON.message],
                    doubles: [],
                    indexes: []
                })
            }));
        }
    }

    const isLive = (twitchJSON.data?.length ?? 0) != 0;
    const title = twitchJSON.data[0]?.title;
    const isWAN = isLive && (title?.includes("WAN") || makeAlwaysWAN);

    if(savedStartTime && !isLive) savedStartTime = false;
    if(savedEndTime && fastCache.lastFetchData?.data?.length == 0) savedEndTime = false;

    const twitchData = url.searchParams.has("short") ? undefined : twitchJSON;
    const started = isLive ? twitchJSON.data[0].started_at : undefined;

    // console.debug(5)

    if(!savedStartTime && started && isWAN) {
        const closestWAN = getClosestWan();
        const distance = Math.abs(Date.now() - closestWAN.getTime())
        // Only record preshow start time if we are within 7 hours of the closest wan
        if(distance < 7 * 60 * 60 * 1000) {
            platform.context.waitUntil((async () => {
                const kvStartTime = await history.get(getUTCDate(closestWAN) + ":preShowStart");
                if(!kvStartTime) {
                    await history.put(getUTCDate(closestWAN) + ":preShowStart", started, {
                        // Expire this key after 15 days to save space over time.
                        // It should be collapsed into a single object at the end of the stream, so no data should be lost.
                        // The collapsing is done in a scheduled worker
                        expirationTtl: 15 * 24 * 60 * 60
                    });
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
            })())
            savedStartTime = true;
        }
    }

    // console.debug(6)

    if(!savedEndTime && !isLive && fastCache.lastFetchData?.data?.length != 0) {
        const closestWAN = getClosestWan();
        const distance = Date.now() - closestWAN.getTime()
        // Only record ending time if we are within 12 hours of the closest wan
        if(distance > 0 && distance < 12 * 60 * 60 * 1000) {
            platform.context.waitUntil((async () => {
                const kvEndTime = await history.get(getUTCDate(closestWAN) + ":showEnd");
                const kvStartTime = await history.get(getUTCDate(closestWAN) + ":mainShowStart");
                if(!kvEndTime && kvStartTime) {
                    await history.put(getUTCDate(getClosestWan()) + ":showEnd", new Date().toISOString(), {
                        // Expire this key after 15 days to save space over time.
                        // It should be collapsed into a single object at the end of the stream, so no data should be lost.
                        // The collapsing is done in a scheduled worker
                        expirationTtl: 15 * 24 * 60 * 60
                    });
                }
            })());
            savedEndTime = true;
        }
    }

    // console.debug(7)

    if(!twitchJSON.message) {
        fastCache.lastFetchData = twitchJSON;
    }

    const remaining = twitchResponse.headers.get("Ratelimit-Remaining");
    const reset = twitchResponse.headers.get("Ratelimit-Reset");
    const limit = twitchResponse.headers.get("Ratelimit-Limit");

    const analytics = platform.env?.TWITCH_ANALYTICS;

    const msUntilReset = Math.max((Number(reset) * 1000) - Date.now(), 0);

    if(Number(remaining) < 50 || (Number(remaining) < 100 && msUntilReset > 15e3)) {
        // If we are low on remaining requests, wait until 1s after the reset in the future.
        fastCache.lastFetch = ((Date.now() + msUntilReset) - cacheTime) + 1e3;
    }

    // console.debug(8)

    if(analytics) {
        analytics.writeDataPoint({
            blobs: [],
            doubles: [remaining, msUntilReset, limit],
            indexes: []
        });
    }

    let debug;
    if(dev) {
        debug = {
            limit: twitchResponse.headers.get("Ratelimit-Limit"),
            remaining,
            reset,
            resetPretty: new Date(Number(reset) * 1000)
                .toLocaleString('en-US', {timeZone: "America/Phoenix"}),
            other: {
                ...Object.fromEntries(twitchResponse.headers)
            }
        }
    }

    const response: TwitchResponse = {
        timestamp: Date.now(),
        debug,
        twitchData,
        isLive,
        isWAN,
        started,
        title
    }
    // console.debug(9)

    if(!isWAN && isNearWan()) {
        log(platform, "Not wan stream when near wan!", title);
    }

    const throttler = (platform?.env?.NOTIFICATION_THROTTLER as DurableObjectNamespace)
    if(isLive && isWAN && throttler && Date.now() - lastNotifSend > (12 * 60 * 60e3) && twitchJSON?.data[0]) {
        // console.debug(9.1)
        lastNotifSend = Date.now();
        const id = throttler.idFromName("n");
        const stub = throttler.get(id);

        // console.debug(9.2)

        if(twitchJSON.data[0].title) {
            const params = new URLSearchParams();
            params.set("title", twitchJSON.data[0].title);

            // console.debug(9.3)

            platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/preshow_live?" + params.toString()))
            // console.debug(9.4)
        }
    } else {
        // console.debug(9.5)
        console.debug("Not sending preshow notification: ", isLive, isWAN, !!throttler, Date.now() - lastNotifSend > (12 * 60 * 60e3), !!twitchJSON?.data[0])
    }
    // console.debug(10)

    const cacheExpires = new Date(Date.now() + cacheTime).toISOString();

    if(cCache && cacheRequest) platform.context.waitUntil(cCache.put(cacheRequest, json(response, {headers: {"Expires": cacheExpires}})));
    return json(response);
}) satisfies RequestHandler;

export type TwitchResponse = {
    timestamp: number,
    debug?: {
        limit: string | null,
        remaining: string | null,
        reset: string | null,
        resetPretty: string,
        other: {
            [header: string]: string
        }
    },
    twitchData?: GetStreamsResponse,
    isLive: boolean,
    isWAN: boolean,
    started?: string,
    title?: string
}

/*
type TwitchAPIResponse = {
    data: {
        id: string,
        user_id: string,
        user_login: string,
        user_name: string,
        game_id: string,
        game_name: string,
        type: string,
        title: string,
        viewer_count: number,
        started_at: string,
        language: string,
        thumbnail_url: string,
        tag_ids: unknown[],
        tags: string[],
        is_mature: boolean
    }[]
}*/
