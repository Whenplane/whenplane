import type {ServerLoad} from "@sveltejs/kit";
import {error} from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils.ts";
import type { WanDb_Episode } from "$lib/wdb_types.ts";

export const load = (async ({params, fetch}) => {
    const showResponsePromise = fetch(
        "/api/history/show/" + params.showDate + "?wdb=true",
        {
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const showResponse = await showResponsePromise;

    const data = await showResponse.json() as HistoricalEntry & {wdb: WanDb_Episode, message?: string};

    if(showResponse.status != 200) {
        throw error(showResponse.status, data.message || showResponse.statusText);
    }

    const mm = data.value?.vods?.youtube ? await fetch("/api/merch-messages/info/" + data.value?.vods?.youtube)
      .then(r => r.json())
      .then(j => j.video as {videoId: string, status: string, title: string} | null)
      : undefined;

    return {
        ...data,
        mm
    };
}) satisfies ServerLoad