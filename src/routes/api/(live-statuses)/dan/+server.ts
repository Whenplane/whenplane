import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {env} from "$env/dynamic/private";
import {dev} from "$app/environment";

const cacheTime = 29e3; // maximum fetch from twitch api once every 30 seconds

const fastCache: {
  lastFetch: number,
  lastFetchData: any
} = {
  lastFetch: 0,
  lastFetchData: {}
};

let lastToken = {
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

  // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
  if(Date.now() - fastCache.lastFetch < cacheTime || (fast && Date.now() - fastCache.lastFetch < 5 * 60 * 60e3)) {
    const isLive = fastCache.lastFetchData.data?.length != 0;

    const twitchData = url.searchParams.has("short") ? undefined : fastCache.lastFetchData;
    const started = isLive ? fastCache.lastFetchData.data[0].started_at : undefined;
    const title = isLive ? fastCache.lastFetchData.data[0].title : undefined;

    return json(
      {
        cached: true,
        lastFetch: fastCache.lastFetch,
        twitchData,
        isLive,
        started,
        title
      }
    )
  }

  const now = new Date();
  // don't check for dan streams on fridays after 4pm
  if(now.getUTCDay() === 5 && now.getUTCHours() >= 11) {
    return json({
      isLive: false,
      bypassed: true,
      bypassed_by: "server"
    });
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
      validUntil: Date.now() + (expires_in * 1000) - 30, // fetch new token 30 seconds before it's supposed to expire,
      dateGenerated: Date.now()
    }
    platform.context.waitUntil(cache.put("wheniswan:twitch:token", JSON.stringify(lastToken)))
  }

  const twitchResponse = await fetch(
    "https://api.twitch.tv/helix/streams?user_login=buhdan",
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

  const twitchData = url.searchParams.has("short") ? undefined : twitchJSON;
  const started = isLive ? twitchJSON.data[0].started_at : undefined;
  const title = isLive ? twitchJSON.data[0].title : undefined;


  if(!twitchJSON.message) {
    fastCache.lastFetchData = twitchJSON;
  }

  const remaining = twitchResponse.headers.get("Ratelimit-Remaining");
  const reset = twitchResponse.headers.get("Ratelimit-Reset");

  const analytics = platform.env?.TWITCH_ANALYTICS;

  if(analytics) {
    analytics.writeDataPoint({
      blobs: [],
      doubles: [remaining, Math.max((Number(reset) * 1000) - Date.now(), 0)],
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
    };
  }

  return json(
    {
      debug,
      twitchData,
      isLive,
      started,
      title
    }
  )
}) satisfies RequestHandler;