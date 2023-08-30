import type {RequestHandler} from "@sveltejs/kit";
import {json} from "@sveltejs/kit";
import type { IsThereWanResponse } from "../isThereWan/+server";
import type { HasDoneResponse } from "../../hasDone/+server";
import type { TwitchResponse } from "../twitch/+server";
import type { YoutubeResponse } from "../youtube/+server";

export const GET = (async ({url, fetch, locals}) => {
    const fast = url.searchParams.get("fast");

    const isThereWan = fetch("/api/isThereWan").then(r => r.json());
    const hasDone = fetch("/api/hasDone").then(r => r.json());

    const twitchStart = Date.now();
    const twitch = await fetch("/api/twitch?short&fast=" + fast)
        .then(r => r.json());
    const twitchTime = Date.now() - twitchStart;

    // const fpStart = Date.now();
    // const floatplane = await fetch("/api/floatplane?short&fast=" + fast)
    //     .then(r => r.json());
    // const fpTime = Date.now() - fpStart;

    const ytStart = Date.now();
    const youtube = await fetch("/api/youtube?short&fast=" + fast)
        .then(r => r.json());
    const ytTime = Date.now() - ytStart;

    locals.addTiming({id: "twitch", duration: twitchTime});
    locals.addTiming({id: "youtube", duration: ytTime});

    const response: AggregateResponse = {
        twitch,
        // floatplane,
        youtube,
        isThereWan: await isThereWan,
        hasDone: await hasDone
    }

    return json(response)
}) satisfies RequestHandler;

export type AggregateResponse = {
    twitch: TwitchResponse,
    youtube: YoutubeResponse,
    isThereWan: IsThereWanResponse,
    hasDone: HasDoneResponse
}