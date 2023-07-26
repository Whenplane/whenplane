import type {ServerLoad} from "@sveltejs/kit";
import {error} from "@sveltejs/kit";

export const load = (async ({platform, params}) => {

    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "History missing!");

    const kvShowInfo = await history.get(params.showDate, {type: 'json'});

    if(kvShowInfo) {
        return {
            name: params.showDate,
            metadata: kvShowInfo
        };
    }

    const oldHistory = await import("$lib/oldHistory");
    const oldShows = oldHistory.history;
    for (const oldShow of oldShows) {
        if(oldShow.name == params.showDate) {
            return oldShow;
        }
    }

}) satisfies ServerLoad