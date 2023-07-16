import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {getClosestWan, getUTCDate} from "$lib/timeUtils";


export const GET = (async ({platform, url}) => {

    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "History not available");

    let date = url.searchParams.get("date");
    if(!date) {
        date = getUTCDate(getClosestWan())
    }

    const fullEntry = history.get(date);
    const partialEntry = history.get(date + ":mainShowStart");

    return json({
        hasDone: !!(await fullEntry) || !!( await partialEntry)
    })

}) satisfies RequestHandler;