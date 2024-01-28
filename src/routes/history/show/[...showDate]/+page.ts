import type {ServerLoad} from "@sveltejs/kit";
import {error} from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils.ts";
import type { WanDb_Episode } from "$lib/wdb_types.ts";

export const load = (async ({params, fetch}) => {
    const response = await fetch(
        "/api/history/show/" + params.showDate + "?wdb=true",
        {
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const data = await response.json() as HistoricalEntry & {wdb: WanDb_Episode, message?: string};

    if(response.status != 200) {
        throw error(response.status, data.message || response.statusText);
    }

    return data;
}) satisfies ServerLoad