import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {getClosestWan, getUTCDate} from "$lib/timeUtils";

const cache_time =  30 * 60e3; // 30 minutes

const cache: {
    lastFetch: number,
    lastData?: HasDoneResponse
} = {lastFetch: 0};

export const GET = (async ({platform, url}) => {
    // if(dev) return json({hasDone: true, dev})

    if(Date.now() - cache.lastFetch < cache_time) {
        return json({
            ...cache.lastData,
            cached: true,
            lastFetch: cache.lastFetch,
            fetchDistance: Date.now() - cache.lastFetch
        });
    }

    cache.lastFetch = Date.now();

    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "History not available");

    let date = url.searchParams.get("date");
    if(!date) {
        date = getUTCDate(getClosestWan())
    }

    const fullEntry = history.get(date);
    const partialEntry = history.get(date + ":mainShowStart");

    const response: HasDoneResponse = {
        hasDone: !!(await fullEntry) || !!(await partialEntry),
        cached: false
    };

    cache.lastData = response;

    return json(response)

}) satisfies RequestHandler;

export type HasDoneResponse = {
    hasDone: boolean,

    cached: boolean
    lastFetch?: number
}