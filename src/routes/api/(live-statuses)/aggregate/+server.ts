import type {RequestHandler} from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import type { IsThereWanResponse } from "../isThereWan/+server";
import type { HasDoneResponse } from "../../hasDone/+server";
import type { TwitchResponse } from "../twitch/+server";
import type { YoutubeResponse } from "../youtube/+server";
import type { LatenessVotingOption } from "$lib/voting.ts";
import type { KVNamespace } from "@cloudflare/workers-types";
import type { SpecialStream } from "$lib/utils.ts";

export const GET = (async ({url, fetch, locals, platform}) => {


    /*const now = new Date();
    if(now.getUTCMonth() === 0 && now.getUTCDate() === 8 && now.getUTCHours() === 16 && now.getUTCMinutes() === 31) {
        throw error(500, "Reload Forcer");
    }*/


    const fast = url.searchParams.get("fast");
    const isNextFast = url.searchParams.get("isNextFast");

    const isThereWan = fetch("/api/isThereWan").then(r => r.json());
    const hasDone = fetch("/api/hasDone").then(r => r.json()).then(r => r.hasDone);
    // const showExtension = (platform?.env?.META as KVNamespace)?.get("showExtension").then(r => r === "true");

    let votesTime: number | undefined;
    const votes = (async () => {
        const start = Date.now();
        const response = await fetch("/api/latenessVoting/votes?fast=" + (fast && !isNextFast))
          .then(r => r.json());
        votesTime = Date.now() - start;
        return response;
    })();

    let twitchTime: number | undefined;
    const twitch = (async () => {
        const start = Date.now();
        const response = await fetch("/api/twitch?short&fast=" + fast)
          .then(r => r.json());
        twitchTime = Date.now() - start;
        return response;
    })();

    let ytTime: number | undefined;
    const youtube = (async () => {
        const start = Date.now();
        const response = await fetch("/api/youtube?short&fast=" + fast)
          .then(r => r.json());
        ytTime = Date.now() - start;
        return response;
    })();

    let spTime: number | undefined;
    const specialStream = (async () => {
        const start = Date.now();
        const response = await fetch("/api/specialStream?short&fast=" + fast)
          .then(r => r.json());
        spTime = Date.now() - start;
        return response;
    })();

    const response: AggregateResponse = {
        twitch: await twitch,
        // floatplane,
        youtube: await youtube,
        isThereWan: await isThereWan,
        hasDone: await hasDone,
        votes: await votes,
        specialStream: await specialStream
        // showExtension: await showExtension
    }

    locals.addTiming({id: "twitch", duration: twitchTime ?? -1});
    locals.addTiming({id: "youtube", duration: ytTime ?? -1});
    locals.addTiming({id: "votes", duration: votesTime ?? -1});
    locals.addTiming({id: "specialStream", duration: spTime ?? -1});

    return json(response)
}) satisfies RequestHandler;

export type AggregateResponse = {
    twitch: TwitchResponse,
    youtube: YoutubeResponse,
    isThereWan: IsThereWanResponse,
    hasDone: boolean,
    votes: LatenessVotingOption[],
    specialStream: SpecialStream
    // showExtension: boolean
}