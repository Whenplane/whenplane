import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";
import { dev, version } from "$app/environment";
import {getClosestWan, getUTCDate} from "$lib/timeUtils";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import type { GetChannelFollowersResponse } from "ts-twitch-api";
import type { TwitchToken } from "$lib/utils.ts";
import { twitchTokenCache } from "$lib/stores.ts";

const cacheTime = 60e3; // maximum fetch from twitch api once every 60 seconds

const fastCache: {
  lastFetch: number,
  lastFetchData?: GetChannelFollowersResponse
} = {
  lastFetch: 0,
  lastFetchData: undefined
};


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

  // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
  if(Date.now() - fastCache.lastFetch < cacheTime || (fast && Date.now() - fastCache.lastFetch < 5 * 60 * 60e3)) {
    const count = fastCache.lastFetchData?.total;

    return json(
      {
        cached: true,
        lastFetch: fastCache.lastFetch,
        count
      }
    )
  }
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
    "https://api.twitch.tv/helix/channels/followers?broadcaster_id=834741282",
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

  const twitchJSON = await twitchResponse.json() as GetChannelFollowersResponse;

  // console.debug(4)

  if(twitchJSON.message) {
    console.warn("Got message in twitch response: ", twitchJSON.message)
    if(platform?.env?.LOG_MESSAGES) {
      platform.context.waitUntil((async () => {
        await platform.env?.LOG_MESSAGES.writeDataPoint({
          blobs: ["Got message in twitch response while getting boca followers: " + twitchJSON.message],
          doubles: [],
          indexes: []
        })
      }));
    }
  }

  fastCache.lastFetch = Date.now();

  const count = twitchJSON.total;

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
    count,
    debug
  }

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
  started?: string
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