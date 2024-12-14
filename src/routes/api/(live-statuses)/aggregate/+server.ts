import type {RequestHandler} from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { IsThereWanResponse } from "../isThereWan/+server";
import type { TwitchResponse } from "../twitch/+server";
import type { YoutubeResponse } from "../youtube/+server";
import type { LatenessVotingOption } from "$lib/voting.ts";
import type { SpecialStream } from "$lib/utils.ts";
import type { NotablePeopleResponse, NotablePeopleShortResponse } from "../notable-streams/+server.ts";
import type { FpEndpointResponse } from "../floatplane/+server.ts";
import { notablePeople } from "../notable-streams/notable-people.ts";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import type { SocketObject } from "../../../../app";

let lastWsMessage: string;

export const GET = (async ({url, fetch, locals, platform}) => {


    /*const now = new Date();
    if(now.getUTCMonth() === 0 && now.getUTCDate() === 12 && now.getUTCHours() === 21 && now.getUTCMinutes() === 1 && now.getUTCSeconds() < 45) {
        throw error(500, "Reload Forcer");
    }*/


    const fast = url.searchParams.get("fast");
    const isNextFast = url.searchParams.get("isNextFast");

    const isThereWan = fetch("/api/isThereWan").then(r => r.json())
      .catch(e => {throw new Error("Error while fetching isThereWan: " + e.message, { cause: e })});
    let hasDoneTimestamp;
    const hasDone = fetch("/api/hasDone").then(r => r.json()).then(r => {
        hasDoneTimestamp = r.timestamp;
        return r.hasDone;
    }).catch(e => {throw new Error("Error while fetching hasDone: " + e.message, { cause: e })});
    // const showExtension = (platform?.env?.META as KVNamespace)?.get("showExtension").then(r => r === "true");

    let votesTime: number | undefined;
    const votes = (async () => {
        const start = Date.now();
        const response = await fetch("/api/latenessVoting/votes?fast=" + (fast && !isNextFast))
          .then(async (r) => {
              const text = await r.text();
              try {
                  return JSON.parse(text);
              } catch(e: any) {
                  throw new Error("Error while fetching votes: " + e.message + ": " + text, { cause: e })
              }
          })
        votesTime = Date.now() - start;
        return response;
    })();

    let twitchTime: number | undefined;
    const twitch = (async () => {
        const start = Date.now();
        const response = await fetch("/api/twitch?short&fast=" + fast)
          .then(r => r.json())
          .catch(e => {throw new Error("Error while fetching twitch: " + e.message, { cause: e })});
        twitchTime = Date.now() - start;
        return response;
    })();

    let ytTime: number | undefined;
    const youtube = (async () => {
        const start = Date.now();
        const response = await fetch("/api/youtube?short&fast=" + fast)
          .then(r => r.json())
          .catch(e => {throw new Error("Error while fetching youtube: " + e.message, { cause: e })});
        ytTime = Date.now() - start;
        return response;
    })();

    let spTime: number | undefined;
    const specialStream = (async () => {
        const start = Date.now();
        const response = await fetch("/api/specialStream?short&fast=" + fast)
          .then(r => r.json())
          .catch(e => {throw new Error("Error while fetching specialStream: " + e.message, { cause: e })});
        spTime = Date.now() - start;
        return response;
    })();

    let fpTime: number | undefined;
    const floatplane = (async () => {
        const start = Date.now();
        const response = await fetch("/api/floatplane?fast=" + fast)
          .then(r => r.json())
          .catch(e => {throw new Error("Error while fetching floatplane: " + e.message, { cause: e })});
        fpTime = Date.now() - start;
        return response;
    })();

    let notableTime: number | undefined;
    const notable = (async () => {
        const start = Date.now();
        const response = await fetch("/api/notable-streams?short&fast=" + fast)
          .then(r => r.json())
          .catch(e => {throw new Error("Error while fetching notable-streams: " + e.message, { cause: e })});
        notableTime = Date.now() - start;
        return response;
    })();

    const response: AggregateResponse = {
        twitch: await twitch,
        // floatplane,
        youtube: await youtube,
        isThereWan: await isThereWan,
        hasDone: await hasDone,
        votes: await votes,
        specialStream: await specialStream,
        floatplane: await floatplane,
        notablePeople: await notable,
        reloadNumber: 42
        // showExtension: await showExtension
    }

    const lowestTimestamp = Math.min(
      response.twitch.timestamp || Number.MAX_SAFE_INTEGER,
      response.youtube.time || Number.MAX_SAFE_INTEGER,
      response.isThereWan.timestamp || Number.MAX_SAFE_INTEGER,
      hasDoneTimestamp || Number.MAX_SAFE_INTEGER,
      response.floatplane.fetched || Number.MAX_SAFE_INTEGER
    )
    console.log({lowestTimestamp/*, timestamps: {
            twitch: response.twitch.timestamp || Number.MAX_SAFE_INTEGER,
            youtube: response.youtube.time || Number.MAX_SAFE_INTEGER,
            isThereWan: response.isThereWan.timestamp || Number.MAX_SAFE_INTEGER,
            hasDone: hasDoneTimestamp || Number.MAX_SAFE_INTEGER,
            floatplane: response.floatplane.fetched || Number.MAX_SAFE_INTEGER
        }*/})

    const thisWsMessage = makeWsMessage(response);
    const thisWsMessageString = JSON.stringify(thisWsMessage);
    if(thisWsMessageString !== lastWsMessage) {
        const objectBinding = platform?.env?.WS_OBJECT;


        if(objectBinding) {
            const objectId = objectBinding.idFromName("a");
            const object = objectBinding.get(objectId);

            platform?.context?.waitUntil(object.fetch("https://DO/sendData?event=aggregate", {
                headers: {
                    "content-type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    timestamp: Date.now(),
                    ...thisWsMessage
                })
            }))
        }
    }
    // console.log({thisWsMessage, lastWsMessage})
    lastWsMessage = thisWsMessageString;

    locals.addTiming({id: "twitch", duration: twitchTime ?? -1});
    locals.addTiming({id: "youtube", duration: ytTime ?? -1});
    locals.addTiming({id: "votes", duration: votesTime ?? -1});
    locals.addTiming({id: "specialStream", duration: spTime ?? -1});
    locals.addTiming({id: "floatplane", duration: fpTime ?? -1});
    locals.addTiming({id: "notable", duration: notableTime ?? -1});

    return json(response)
}) satisfies RequestHandler;

export type AggregateResponse = {
    twitch: TwitchResponse,
    youtube: YoutubeResponse,
    isThereWan: IsThereWanResponse,
    hasDone: boolean,
    votes: LatenessVotingOption[],
    specialStream: SpecialStream,
    floatplane: FpEndpointResponse,
    notablePeople: NotablePeopleResponse
    reloadNumber: number
    // showExtension: boolean
}

function makeWsMessage(response: AggregateResponse) {
    // If updating, don't forget to also update the part that reads this in the root page.ts
    return {
        youtube: {
            isLive: response.youtube.isLive,
            upcoming: response.youtube.upcoming,
            videoId: response.youtube.videoId,
            started: response.youtube.started,
            isWAN: response.youtube.isWAN,
        },
        twitch: {
            isLive: response.twitch.isLive,
            isWAN: response.twitch.isWAN,
            started: response.twitch.started
        },
        specialStream: response.specialStream,
        floatplane: {
            isLive: response.floatplane?.isLive,
            isWAN: response.floatplane?.isWAN,
            isThumbnailNew: response.floatplane?.isThumbnailNew
        },
        notablePeople: Object.keys(response.notablePeople)
          .filter(key => Object.keys(notablePeople).includes(key))
          .reduce((obj: NotablePeopleResponse, key) => {
              obj[key] = response.notablePeople[key];
              return obj;
          }, {}),
        hasDone: response.hasDone,
        isThereWan: {
            text: response.isThereWan.text,
            image: response.isThereWan.image
        },
        votes: response.votes
    }
}