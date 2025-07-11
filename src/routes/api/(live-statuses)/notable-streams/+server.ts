import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";
import { dev, version } from "$app/environment";
import { isNearWan } from "$lib/timeUtils.ts";
import type { GetStreamsResponse } from "ts-twitch-api";
import { retryD1, type TwitchToken } from "$lib/utils.ts";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import {notablePeople as people} from "./notable-people";
import { twitchTokenCache } from "$lib/stores.ts";
import { log } from "$lib/server/server-utils"

let fastCache: {
  lastFetch: number,
  lastFetchData: Responses
} = {
  lastFetch: 0,
  lastFetchData: {}
};

const allowedHosts = [
  "localhost:5173",
  "boca.lol",
  "boca.gay"
];

let recordedBocaStreamStart = false;
let firstBoca = true;
let bocaWasLive: string | false = false;
let lastBocaBadEndCheck = 0;

const lastNotifSends: {[channel: string]: number} = {};

export const GET = (async ({platform, url, request}) => {

  const origin = request.headers.get("origin");
  let accessControlAllowOrigin: string | undefined = undefined;
  const host = origin ? new URL(origin).host : origin
  if(host && allowedHosts.includes(host)) {
    accessControlAllowOrigin = origin ?? undefined;
  }

  const cache = platform?.env?.CACHE;
  if(!cache) throw error(503, "Cache not available");
  if(!platform?.context) throw error(503, "Request context not available!");

  if(!env.TWITCH_CLIENT_ID) throw error(503, "Missing twitch client id!");
  if(!env.TWITCH_SECRET) throw error(503, "Missing twitch client secret!");

  const now = new Date();

  // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
  const fast = url.searchParams.get("fast") === "true";

  const cacheTime = fast ? (5 * 60 * 60e3) : (isNearWan(now) ? 2.9 * 60e3 : 29e3); // update every 30 seconds when not around wan time. every 3 minutes when near wan

  const fetchDistance = Date.now() - fastCache.lastFetch;
  if(fetchDistance < cacheTime) {
    const shortResponse = makeShortResponses(fastCache.lastFetchData, url);
    return json({
      ...shortResponse,
      cached: true,
      fetchDistance,
      cacheTime
    }, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      headers: {
        "Access-Control-Allow-Origin": accessControlAllowOrigin,
        "Vary": "Origin"
      }
    });
  }

  let cCache: Cache | undefined = undefined;
  let cacheRequest: Request | undefined = undefined;
  if(typeof caches !== "undefined") {
    cCache = await caches.open("whenplane:twitch-fetch");
    cacheRequest = new Request("https://cache/notable-streams?short=" + (url.searchParams.get("short") + "&origin=" + origin));
    const cacheMatch = await cCache.match(cacheRequest);

    if(cacheMatch) {
      const fetched = cacheMatch.headers.get("x-fetched")
      if(fetched && Date.now() - new Date(fetched).getTime() < cacheTime) {
        return new Response(cacheMatch.body, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          headers: {
            ...cacheMatch.headers,
            "Access-Control-Allow-Origin": accessControlAllowOrigin,
            "Vary": "Origin"
          }
        });
      }
    }
  } else {
    console.warn("missing cache api!")
  }

  // don't check for other streams when close to wan (no longer used, longer cache is used instead)
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

    twitchTokenCache.token = {
      token: access_token,
      validUntil: Date.now() + (expires_in * 1000) - 30, // fetch new token 30 seconds before it's supposed to expire,
      dateGenerated: Date.now()
    }
    platform.context.waitUntil(cache.put("wheniswan:twitch:token", JSON.stringify(twitchTokenCache.token)))
  }

  if(fastCache.lastFetchData) fastCache.lastFetch = Date.now();

  const responses: Responses = {};

  const promises = [];

  let minRemaining;
  let maxResetTime;

  for (const channel in people) {
    promises.push((async () => {
      const name = people[channel];

      const twitchResponse = await fetch(
        "https://api.twitch.tv/helix/streams?user_login=" + channel,
        {
          headers: {
            "Client-ID": env.TWITCH_CLIENT_ID ?? "",
            "Authorization": "Bearer " + twitchTokenCache.token.token,
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

      const remaining = twitchResponse.headers.get("Ratelimit-Remaining");
      const reset = twitchResponse.headers.get("Ratelimit-Reset");

      const analytics = platform.env?.TWITCH_ANALYTICS;
      analytics?.writeDataPoint({
        blobs: [],
        doubles: [remaining, Math.max((Number(reset) * 1000) - Date.now(), 0)],
        indexes: []
      });

      if(remaining) minRemaining = Math.min(Number(remaining), minRemaining ?? Number(remaining))
      if(reset) maxResetTime = Math.min(Number(reset), maxResetTime ?? Number(reset))

      if(channel === "bocabola" && twitchJSON.data && twitchJSON.data.length > 0 && !dev) {

        if(!recordedBocaStreamStart) {
          const db = platform?.env?.BOCA_DB.withSession();
          if(!db) {
            log(platform, "Unable to insert boca stream due to missing db!");
            return;
          }

          const started = twitchJSON.data[0].started_at;
          const startedEpoch = new Date(started).getTime();
          platform?.context?.waitUntil((async () => {
            if(firstBoca) {
              firstBoca = false;
              await db.prepare("create table if not exists boca_streams (startedEpoch integer, started text, ended text, UNIQUE(startedEpoch, started))")
                .run();
              await db.prepare("create index if not exists boca_streams_startedEpoch on boca_streams(startedEpoch)")
                .run();
            }

            await db.prepare("insert into boca_streams (startedEpoch, started) values (?, ?) ON CONFLICT(startedEpoch, started) DO NOTHING")
              .bind(startedEpoch, started)
              .run();
            if(Date.now() - lastBocaBadEndCheck > 10 * 60e3) {
              lastBocaBadEndCheck = Date.now();
              const existingEnded = await db.prepare("select ended from boca_streams where startedEpoch=?")
                .bind(startedEpoch)
                .first<{ended: string}>()
                .then(r => r?.ended);
              if(existingEnded) { // we recorded an end time even though the stream isn't over! remove it as long as it's been a few mins
                const existingEndedDate = new Date(existingEnded);
                if(Date.now() - existingEndedDate.getTime() > 10 * 60e3) { // we wait a few minutes in case its just twitch not syncing globally yet that the stream ended
                  await db.prepare("update boca_streams set ended=? where startedEpoch=?")
                    .bind(null, startedEpoch)
                    .run();
                  console.warn("Removed boca stream end time for " + started + " because boca is still live!");
                }
              }
            }
          })());
          recordedBocaStreamStart = true;
          bocaWasLive = started;
        }

        const throttler = (platform?.env?.NOTIFICATION_THROTTLER as DurableObjectNamespace)
        lastNotifSends[channel] = Date.now();
        const id = throttler.idFromName("n");
        const stub = throttler.get(id);

        const params = new URLSearchParams();
        params.set("title", twitchJSON.data?.[0]?.title+"");
        params.set("image", twitchJSON.data?.[0]?.thumbnail_url+"");
        params.set("started", twitchJSON.data?.[0]?.started_at+"");

        platform?.context?.waitUntil(stub.fetch("https://whenplane-notification-throttler/elijah_stream?" + params.toString()))
      } else if(channel === "bocabola" && !dev) {
        if(bocaWasLive) {
          const time = new Date().toISOString()
          platform?.context?.waitUntil((async () => {
            const db = platform?.env?.BOCA_DB.withSession();
            if(!db) {
              log(platform, "Unable to insert boca stream due to missing db!");
              return;
            }

            await retryD1(() =>
              db.prepare("update boca_streams set ended=? where started=? and ended IS NULL")
                .bind(time, bocaWasLive)
                .run()
            );
          })());
          bocaWasLive = false;
        }
      }
    })())
  }

  await Promise.all(promises)

  fastCache = {
    lastFetchData: responses,
    lastFetch: Date.now()
  }

  const msUntilReset = Math.max((Number(maxResetTime) * 1000) - Date.now(), 0);
  if(Number(minRemaining) < 200 || (Number(minRemaining) < 250 && msUntilReset > 30e3)) {
    // If we are low on remaining requests, wait until 1s after the reset in the future.
    fastCache.lastFetch = ((Date.now() + msUntilReset) - cacheTime) + 1e3;
  }

  const shortResponses: ShortResponses = makeShortResponses(responses, url);

  const response = json(shortResponses, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    headers: {
      "Access-Control-Allow-Origin": accessControlAllowOrigin,
      "Vary": "Origin"
    }
  });

  if(cCache && cacheRequest) platform.context.waitUntil(
    cCache.put(
      cacheRequest,
      json(
        shortResponses,
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          headers: {
            "x-fetched": new Date().toISOString(),
            "Access-Control-Allow-Origin": accessControlAllowOrigin,
            "Vary": "Origin"
          }
        }
        )
    )
  );
  return response
}) satisfies RequestHandler;


function makeShortResponses(responses: Responses, url: URL): ShortResponses {
  const shortResponses: ShortResponses = {};

  for (const channel of Object.keys(people)) {
    const response = responses[channel];
    const name = people[channel];

    if(!response) {
      console.warn("Missing response for " + name);
      continue;
    }

    const isLive = (response.data?.length ?? 0) != 0 /*|| dev*/;

    const twitchData = url.searchParams.has("short") ? undefined : response;
    const started = isLive ? response.data?.[0]?.started_at : undefined;
    const title = isLive ? response.data?.[0]?.title : undefined;
    const game = isLive ? response.data?.[0]?.game_name : undefined;

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
