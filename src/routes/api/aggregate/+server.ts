import type {HandleFetch} from "@sveltejs/kit";
import {json} from "@sveltejs/kit";

export const GET = (async ({request, fetch}) => {

    const twitchStart = Date.now();
    const twitch = await fetch("/api/twitch?short").then(r => r.json());
    const twitchTime = Date.now() - twitchStart;

    const fpStart = Date.now();
    const floatplane = await fetch("/api/floatplane?short").then(r => r.json());
    const fpTime = Date.now() - fpStart;

    const ytStart = Date.now();
    const youtube = await fetch("/api/youtube?short").then(r => r.json());
    const ytTime = Date.now() - ytStart;

    return json({
        twitch,
        floatplane,
        youtube
    }, {
        headers: {
            "Server-Timing": "twitch;dur=" + twitchTime + "," +
                "floatplane;dur=" + fpTime + "," +
                "youtube;dur=" + ytTime
        }
    })
}) satisfies HandleFetch;