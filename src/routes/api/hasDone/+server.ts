import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import { getClosestWan, getUTCDate, isNearWan } from "$lib/timeUtils";

const WAN_CACHE_TIME =  30 * 60e3; // 30 minutes
const NORMAL_CACHE_TIME = 24 * 60 * 60e3; // 24 hours

const cache: {
    lastFetch: number,
    lastData?: HasDoneResponse
} = {lastFetch: 0};

export const GET = (async ({platform, url, locals}) => {
    // if(dev) return json({hasDone: true, dev})

    const fast = url.searchParams.get("fast") === "true";
    const cache_time = fast ? (5 * 60 * 60e3) : (isNearWan() ? WAN_CACHE_TIME : NORMAL_CACHE_TIME);

    if(Date.now() - cache.lastFetch < cache_time && cache.lastData) {
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

    let fullTime: number | undefined = undefined;
    let partialTime: number | undefined = undefined;

    const start = Date.now();
    const fullEntry = history.get(date).then(r => {fullTime = Date.now() - start; return r;});

    const partialStart = Date.now();
    const partialEntry = history.get(date + ":mainShowStart").then(r => {partialTime = Date.now() - partialStart; return r;});

    const response: HasDoneResponse = {
        timestamp: Date.now(),
        hasDone: !!(await fullEntry) || !!(await partialEntry),
        cached: false
    };

    locals.addTiming(
      {id: "fullEntry", duration: fullTime ?? -1},
      {id: "partialEntry", duration: partialTime ?? -1},
      {id: "total", duration: Date.now() - start}
    );

    cache.lastData = response;

    return json(response)

}) satisfies RequestHandler;

export type HasDoneResponse = {
    timestamp: number,
    hasDone: boolean,

    cached: boolean
    lastFetch?: number
}