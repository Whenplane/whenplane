import { redirect, type ServerLoad } from "@sveltejs/kit";
import {error} from "@sveltejs/kit";
import { wait, type HistoricalEntry } from "$lib/utils.ts";
import type { Timestamp } from "$lib/timestamps/types.ts";

export const load = (async ({params, fetch, platform, url, parent}) => {

    const data = await parent();

    const youtubeId = data.value?.vods?.youtube;

    const mm = youtubeId ? fetch("/api/merch-messages/info/" + youtubeId)
      .then(r => r.json())
      .then(j => j.video as {videoId: string, status: string, title: string, messageCount?: number | null} | null)
      : undefined;

    const timestamps = youtubeId ? fetch("/api/timestamps/" + youtubeId).then(r => r.json() as Promise<Timestamp[]>) : undefined;

    if(youtubeId) await wait(25); // wait 25ms for above two promises to have a small chance of finishing

    return {
        mm,
        timestamps
    };
}) satisfies ServerLoad