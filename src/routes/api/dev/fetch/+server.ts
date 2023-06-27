import type {RequestHandler} from "@sveltejs/kit";
import {dev} from "$app/environment";
import {error, json} from "@sveltejs/kit";
import type {HistoricalEntry} from "$lib/oldHistory";

/**
 * This route is for populating dev with data from prod
 */
export const GET = (async ({platform}) => {
    if(!dev) throw error(503, "Not available in prod");

    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "Missing history KV!");
    await putHistory(history);

    const meta = platform?.env?.META;
    if(!meta) throw error(503, "Missing history KV!");
    await putRecords(meta);

    return json({success: true});

}) satisfies RequestHandler;

async function putHistory(history: KVNamespace) {
    const prodData = await fetch("https://wheniswan.pages.dev/api/history/year/all")
        .then(r => r.json()) as HistoricalEntry[];

    for (const show of prodData) {
        await history.put(show.name, JSON.stringify(show.metadata), {metadata: show.metadata})
    }
}

async function putRecords(meta: KVNamespace) {
    const prodData = await fetch("https://wheniswan.pages.dev/api/history/records")
        .then(r => r.json());

    await meta.put("closest", prodData.closest);
    await meta.put("longestPreShow", prodData.longestPreShow);
    await meta.put("longestShow", prodData.longestShow);
    await meta.put("mostLate", prodData.mostLate);
}