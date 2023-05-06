import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";
import {dev} from "$app/environment";

const cacheTime = 5000; // maximum fetch from twitch api once every 5 seconds

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
    if(!cache) throw error(503, "Cache not available");

    if(!env.TWITCH_CLIENT_ID) throw error(503, "Missing twitch client id!");
    if(!env.TWITCH_SECRET) throw error(503, "Missing twitch client secret!");

    if(Date.now() - fastCache.lastFetch < cacheTime) { // before refreshing, fetch cache from KV
        const newCache = await cache.get("wheniswan:twitch:cache", {type: "json"});
        if(newCache) {
            fastCache = newCache;
        }
    }

    if(Date.now() - fastCache.lastFetch < cacheTime) {
        const isLive = fastCache.lastFetchData.data.length != 0;
        const isWAN = isLive && fastCache.lastFetchData.data[0].title.includes("WAN") && new Date().getDay() === 5;

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
        await cache.put("wheniswan:twitch:token", JSON.stringify(lastToken));
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
    if(!twitchJSON.message) {
        fastCache.lastFetchData = twitchJSON;
        await cache.put("wheniswan:twitch:cache", JSON.stringify(fastCache))
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

    const isLive = twitchJSON.data.length != 0;
    const isWAN = isLive && twitchJSON.data[0].title.includes("WAN") && new Date().getDay() === 5;

    const twitchData = url.searchParams.has("short") ? undefined : twitchJSON;
    const started = isLive ? twitchJSON.data[0].started_at : undefined;

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