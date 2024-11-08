import { redirect, type ServerLoad } from "@sveltejs/kit";
import {error} from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils.ts";
import type { Timestamp } from "$lib/timestamps/types.ts";

export const load = (async ({params, fetch, platform, url}) => {

    const youtubeToDate = platform?.env?.YOUTUBE_TO_DATE;
    if(params.showDate && !params.showDate.includes("/") && youtubeToDate) {
        const date = await youtubeToDate.get(params.showDate);
        if(date) {
            throw redirect(301, "/history/show/" + date + (url.searchParams.get("hash") ?? ""));
        }
    }

    const showResponsePromise = fetch(
        "/api/history/show/" + params.showDate,
        {
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const showResponse = await showResponsePromise;

    const data = await showResponse.json() as HistoricalEntry & {message?: string};

    if(showResponse.status != 200) {
        throw error(showResponse.status, data.message || showResponse.statusText);
    }

    const youtubeId = data.value?.vods?.youtube;

    const mm = youtubeId ? fetch("/api/merch-messages/info/" + youtubeId)
      .then(r => r.json())
      .then(j => j.video as {videoId: string, status: string, title: string} | null)
      : undefined;

    const timestamps = youtubeId ? fetch("/api/timestamps/" + youtubeId).then(r => r.json() as Promise<Timestamp[]>) : undefined;

    return {
        ...data,
        mm,
        timestamps
    };
}) satisfies ServerLoad