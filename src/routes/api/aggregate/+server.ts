import type {HandleFetch} from "@sveltejs/kit";
import {json} from "@sveltejs/kit";

export const GET = (async ({request, fetch}) => {
    return json({
        twitch: await fetch("/api/twitch?short").then(r => r.json()),
        floatplane: await fetch("/api/floatplane?short").then(r => r.json()),
        youtube: await fetch("/api/youtube?short").then(r => r.json())
    })
}) satisfies HandleFetch;