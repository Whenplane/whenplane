import type {RequestHandler} from "@sveltejs/kit";
import {dev} from "$app/environment";
import {error, json} from "@sveltejs/kit";
import { type HistoricalEntry, wait } from "$lib/utils";
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
    const prodData = await fetch("https://whenplane.pages.dev/api/history/year/all")
        .then(r => r.json()) as HistoricalEntry[];


    let rl = 0;
    for (const show of prodData) {
        let rlIncreased = false;
        while(true) {
            const response = await fetch("https://whenplane.pages.dev/api/history/show/" + show.name, {
                headers: {
                    "User-Agent": "Whenplane-local-dev"
                }
            });
            if(response.status != 200) {
                if(response.status == 429) {
                    console.warn("Ratelimited! Sleeping for 10s");
                    await wait(10e3);
                    if(!rlIncreased) {
                        rl++;
                        rlIncreased = true;
                    }
                    continue;
                }
                console.warn("Skipping '" + show.name + "' due to " + response.status + " " + response.statusText);
                break;
            }
            const data = await response.json();
            await history.put(show.name, JSON.stringify(data.value), {metadata: data.metadata});
            await wait(500 + (100 * rl)); // prevent rate limiting
            break;
        }
    }
}

async function putRecords(meta: KVNamespace) {
    const prodData = await fetch("https://whenplane.pages.dev/api/history/records")
        .then(r => r.json());

    await meta.put("earliest", JSON.stringify(prodData.earliest));
    await meta.put("longestPreShow", JSON.stringify(prodData.longestPreShow));
    await meta.put("shortestPreShow", JSON.stringify(prodData.shortestPreShow));
    await meta.put("longestShow", JSON.stringify(prodData.longestShow));
    await meta.put("shortestShow", JSON.stringify(prodData.shortestShow));
    await meta.put("mostLate", JSON.stringify(prodData.mostLate));
    await meta.put("averageLateness", JSON.stringify(prodData.averageLateness));
    await meta.put("latenessStandardDeviation", JSON.stringify(prodData.latenessStandardDeviation));
    await meta.put("medianLateness", JSON.stringify(prodData.medianLateness));
    await meta.put("lateStreak", JSON.stringify(prodData.lateStreak));
    await meta.put("showStreak", JSON.stringify(prodData.showStreak));
}