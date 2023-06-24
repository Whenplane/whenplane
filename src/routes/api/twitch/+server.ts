import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";
import {dev} from "$app/environment";
import {getClosestWan, getUTCDate} from "$lib/timeUtils";

const cacheTime = 5000; // maximum fetch from twitch api once every 5 seconds

const makeAlwaysWAN = dev;

let savedStartTime: boolean | undefined = undefined;
let savedEndTime: boolean | undefined = undefined;

let fastCache: {
    lastFetch: number,
    lastFetchData: any
} = {
    lastFetch: 0,
    lastFetchData: {}
};

let lastToken = {
    token: "",
    validUntil: 0
}

export const GET = (async ({platform, url}) => {

    const cache = platform?.env?.CACHE;
    const history = platform?.env?.HISTORY;
    if(!cache) throw error(503, "Cache not available");
    if(!history) throw error(503, "History not available");
    if(!platform?.context) throw error(503, "Request context not available!");

    if(!env.TWITCH_CLIENT_ID) throw error(503, "Missing twitch client id!");
    if(!env.TWITCH_SECRET) throw error(503, "Missing twitch client secret!");

    if(Date.now() - fastCache.lastFetch < cacheTime) { // before refreshing, fetch cache from KV
        const newCache = await cache.get("wheniswan:twitch:cache", {type: "json"});
        if(newCache) {
            fastCache = newCache;
        }
    }

    const fast = url.searchParams.get("fast") === "true";

    // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
    if(Date.now() - fastCache.lastFetch < cacheTime || (fast && Date.now() - fastCache.lastFetch < 5 * 60 * 60e3)) {
        const isLive = fastCache.lastFetchData.data?.length != 0;
        const isWAN = isLive && (fastCache.lastFetchData.data[0].title.includes("WAN") || makeAlwaysWAN);

        const twitchData = url.searchParams.has("short") ? undefined : fastCache.lastFetchData;
        const started = isLive ? fastCache.lastFetchData.data[0].started_at : undefined;

        return json(
            {
                cached: true,
                lastFetch: fastCache.lastFetch,
                twitchData,
                isLive,
                isWAN,
                started
            }
        )
    }

    if(lastToken.validUntil < Date.now()) {
        const newToken = await cache.get("wheniswan:twitch:token", {type: "json"});
        if(newToken) {
            lastToken = newToken;
        }
    }

    if(lastToken.validUntil < Date.now()) {
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

        lastToken = {
            token: access_token,
            validUntil: Date.now() + (expires_in * 1000) - 30 // fetch new token 30 seconds before it's supposed to expire
        }
        platform.context.waitUntil(cache.put("wheniswan:twitch:token", JSON.stringify(lastToken)))
    }

    const twitchResponse = await fetch(
        "https://api.twitch.tv/helix/streams?user_login=linustech",
        {
            headers: {
                "Client-ID": env.TWITCH_CLIENT_ID,
                "Authorization": "Bearer " + lastToken.token
            }
        }
    )

    const twitchJSON = await twitchResponse.json();

    if(twitchJSON.message) console.warn("Got message in twitch response: ", twitchJSON.message)

    fastCache.lastFetch = Date.now();

    const isLive = twitchJSON.data?.length != 0;
    const isWAN = isLive && (twitchJSON.data[0].title.includes("WAN") || makeAlwaysWAN);

    if(savedStartTime && !isLive) savedStartTime = false;
    if(savedEndTime && fastCache.lastFetchData.data?.length == 0) savedEndTime = false;

    const twitchData = url.searchParams.has("short") ? undefined : twitchJSON;
    const started = isLive ? twitchJSON.data[0].started_at : undefined;

    console.log({savedStartTime, started, isWAN})
    if(!savedStartTime && started && isWAN) {
        const closestWAN = getClosestWan();
        const distance = Math.abs(Date.now() - closestWAN.getTime())
        console.log({distance})
        // Only record preshow start time if we are within 7 hours of the closest wan
        if(distance < 7 * 60 * 60 * 1000) {
            console.log("waitUntil :)")
            platform.context.waitUntil((async () => {
                console.log("inside waitUnti")
                const kvStartTime = await history.get(getUTCDate(closestWAN) + ":preShowStart");
                if(!kvStartTime) {
                    await history.put(getUTCDate(closestWAN) + ":preShowStart", started, {
                        // Expire this key after 15 days to save space over time.
                        // It should be collapsed into a single object at the end of the stream, so no data should be lost.
                        // The collapsing is done in a scheduled worker
                        expirationTtl: 15 * 24 * 60 * 60
                    });
                }
            })())
            savedStartTime = true;
        }
    }

    if(!savedEndTime && !isLive && fastCache.lastFetchData.data?.length != 0) {
        const closestWAN = getClosestWan();
        const distance = Date.now() - closestWAN.getTime()
        // Only record ending time if we are within 7 hours of the closest wan
        if(distance > 0 && distance < 7 * 60 * 60 * 1000) {
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

    if(!twitchJSON.message) {
        fastCache.lastFetchData = twitchJSON;
        platform.context.waitUntil(cache.put("wheniswan:twitch:cache", JSON.stringify(fastCache)))
    }

    let debug;
    if(dev) {
        const reset = twitchResponse.headers.get("Ratelimit-Reset");
        debug = {
            limit: twitchResponse.headers.get("Ratelimit-Limit"),
            remaining: twitchResponse.headers.get("Ratelimit-Remaining"),
            reset,
            resetPretty: new Date(Number(reset) * 1000)
                .toLocaleString('en-US', {timeZone: "America/Phoenix"})
        }
    }

    return json(
        {
            debug,
            twitchData,
            isLive,
            isWAN,
            started
        }
    )
}) satisfies RequestHandler;