import type { PageLoad } from "./$types";
import { dev } from "$app/environment";
import type { AggregateResponse } from "../../api/(live-statuses)/aggregate/+server";
import { overwriteData } from "$lib/stores.ts";

export const load = (async ({ fetch, url }) => {
    const liveStatus: AggregateResponse | undefined = await fetch("/api/aggregate?fast=true")
        .then((r) => r.json())
        .catch(() => undefined);

    if (liveStatus && overwriteData.data) {
        // merge in any fresh websocket data (written by Socket.svelte)
        if (Date.now() - overwriteData.lastData > 20e3) {
            overwriteData.data = undefined;
        } else {
            liveStatus.youtube = { ...liveStatus.youtube, ...overwriteData.data.youtube };
            liveStatus.twitch = { ...liveStatus.twitch, ...overwriteData.data.twitch };
            liveStatus.floatplane = { ...liveStatus.floatplane, ...overwriteData.data.floatplane };
        }
    }

    return {
        liveStatus,
        useWebSocket: !url.searchParams.has("poll") && !dev
    };
}) satisfies PageLoad;
