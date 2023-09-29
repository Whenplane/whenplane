import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {getClosestWan, getUTCDate} from "$lib/timeUtils";
import { dev } from "$app/environment";


export const GET = (async ({platform, url}) => {
    // if(dev) return json({hasDone: true, dev})

    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "History not available");

    let date = url.searchParams.get("date");
    if(!date) {
        date = getUTCDate(getClosestWan())
    }

    const fullEntry = history.get(date);
    const partialEntry = history.get(date + ":mainShowStart");

    const response: HasDoneResponse = {
        hasDone: !!(await fullEntry) || !!(await partialEntry)
    };

    return json(response)

}) satisfies RequestHandler;

export type HasDoneResponse = {
    hasDone: boolean
}