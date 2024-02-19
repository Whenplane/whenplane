import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";
import { version } from "$app/environment";
import { isNearWan } from "$lib/timeUtils.ts";
import type { GetStreamsResponse } from "ts-twitch-api";
import type { TwitchToken } from "$lib/utils.ts";

const people: { [channel: string]: string } = {
  "bocabola_": "Elijah",
  "buhdan": "Dan",
  "luke_lafr": "Luke",
  // "ajgeiss0702": "Test"
}

let fastCache: {
  lastFetch: number,
  lastFetchData: Responses
} = {
  lastFetch: 0,
  lastFetchData: {}
};

let lastToken: TwitchToken = {
  token: "",
  validUntil: 0,
  dateGenerated: 0
}

export const GET = (async ({platform, url}) => {

  const cache = platform?.env?.CACHE;
  if(!cache) throw error(503, "Cache not available");
  if(!platform?.context) throw error(503, "Request context not available!");

  if(!env.TWITCH_CLIENT_ID) throw error(503, "Missing twitch client id!");
  if(!env.TWITCH_SECRET) throw error(503, "Missing twitch client secret!");

  const fast = url.searchParams.get("fast") === "true";

  const cacheTime = isNearWan() ? 5 * 60e3 : 29e3; // update every 30 seconds when not around wan time. every 5 minutes when near wan

  const fetchDistance = Date.now() - fastCache.lastFetch;
  // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
  if(fetchDistance < cacheTime || (fast && fetchDistance < 5 * 60 * 60e3)) {
    const shortResponse = makeShortResponses(fastCache.lastFetchData, url);
    return json({
      ...shortResponse,
      cached: true,
      fetchDistance,
      cacheTime
    });
  }

  // don't check for other streams when close to wan (no longer used, 30 minute cache is used instead)
  /*if(isNearWan()) {
    const shortResponse: {[channel: string]: unknown} = {};
    for (const channel in people) {
      shortResponse[channel] = {
        isLive: false,
        bypassed: true,
        bypassed_by: "server"
      }
    }
    return json(shortResponse);
  }*/

  if(lastToken.validUntil < Date.now()) {
    const newToken = await cache.get<TwitchToken>("wheniswan:twitch:token", {type: "json"});

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
          "Content-Type": "application/x-www-form-urlencoded",
          "referer": "whenplane.com",
          "x-whenplane-version": version,
          "user-agent": "Whenplane/" + version
        },
        body: formBody
      }
    ).then(r => r.json());

    if(message) console.warn("Got message in twitch response while getting token: ", message)

    console.log("Got access token: ", (access_token ? access_token.substring(0, 2) : access_token))

    lastToken = {
      token: access_token,
      validUntil: Date.now() + (expires_in * 1000) - 30, // fetch new token 30 seconds before it's supposed to expire,
      dateGenerated: Date.now()
    }
    platform.context.waitUntil(cache.put("wheniswan:twitch:token", JSON.stringify(lastToken)))
  }

  if(fastCache.lastFetchData) fastCache.lastFetch = Date.now();

  const responses: Responses = {};

  const promises = [];

  for (const channel in people) {
    promises.push((async () => {
      const name = people[channel];

      const twitchResponse = await fetch(
        "https://api.twitch.tv/helix/streams?user_login=" + channel,
        {
          headers: {
            "Client-ID": env.TWITCH_CLIENT_ID ?? "",
            "Authorization": "Bearer " + lastToken.token,
            "referer": "whenplane.com",
            "x-whenplane-version": version,
            "user-agent": "Whenplane/" + version
          }
        }
      )

      const twitchJSON: GetStreamsResponse & {message?: string} = await twitchResponse.json();

      if(twitchJSON.message) console.warn("Got message in twitch response for " + channel + ": ", twitchJSON.message)

      responses[channel] = {
        ...twitchJSON,
        name
      }

      const analytics = platform.env?.TWITCH_ANALYTICS;
      if(analytics) {

        const remaining = twitchResponse.headers.get("Ratelimit-Remaining");
        const reset = twitchResponse.headers.get("Ratelimit-Reset");

        analytics.writeDataPoint({
          blobs: [],
          doubles: [remaining, Math.max((Number(reset) * 1000) - Date.now(), 0)],
          indexes: []
        });
      }
    })())
  }

  await Promise.all(promises)

  fastCache = {
    lastFetchData: responses,
    lastFetch: Date.now()
  }

  const shortResponses: ShortResponses = makeShortResponses(responses, url);

  return json(shortResponses)
}) satisfies RequestHandler;


function makeShortResponses(responses: Responses, url: URL): ShortResponses {
  const shortResponses: ShortResponses = {};

  for (const channel in responses) {
    const response = responses[channel];
    const name = people[channel];

    const isLive = response.data?.length != 0;

    const twitchData = url.searchParams.has("short") ? undefined : response;
    const started = isLive ? response.data[0]?.started_at : undefined;
    const title = isLive ? response.data[0]?.title : undefined;
    const game = isLive ? response.data[0]?.game_name : undefined;

    shortResponses[channel] = {
      twitchData,
      isLive,
      started,
      title,
      name,
      channel,
      game
    }
  }

  return shortResponses;
}

export type NotablePeopleResponse = ShortResponses;
export type NotablePeopleShortResponse = ShortResponse;

type ShortResponses = {
  [channel: string]: ShortResponse
}
type ShortResponse = {
  isLive: boolean,
  twitchData?: GetStreamsResponse & {message?: string, name: string},
  started?: string,
  title?: string,
  name: string,
  channel: string,
  game?: string
}

type Responses = {
  [channel: string]: GetStreamsResponse & {message?: string, name: string}
}