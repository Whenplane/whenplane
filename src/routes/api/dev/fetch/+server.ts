import type {RequestHandler} from "@sveltejs/kit";
import {dev} from "$app/environment";
import {error, json} from "@sveltejs/kit";
import type {HistoricalEntry} from "$lib/oldHistory";
import type {KVNamespace} from "@cloudflare/workers-types"

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
        const response = await fetch("https://wheniswan.pages.dev/api/history/show/" + show.name);
        if(response.status != 200) {
            console.warn("Skipping '" + show.name + "' due to " + response.status + " " + response.statusText);
            continue;
        }
        const data = await response.json();
        await history.put(show.name, JSON.stringify(data.value), {metadata: data.metadata})
    }
}

async function putRecords(meta: KVNamespace) {
    const prodData = await fetch("https://wheniswan.pages.dev/api/history/records")
        .then(r => r.json());

    await meta.put("earliest", JSON.stringify(prodData.earliest));
    await meta.put("longestPreShow", JSON.stringify(prodData.longestPreShow));
    await meta.put("longestShow", JSON.stringify(prodData.longestShow));
    await meta.put("mostLate", JSON.stringify(prodData.mostLate));
}