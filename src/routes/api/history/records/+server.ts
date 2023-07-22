import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {dev} from "$app/environment";
import {random, wait} from "$lib/utils";

// Cache in edge for 2 hours
const cacheTtl = 60 * 60 * 2;

// In dev, random test latencies are used
const testMin = 5;
const testMax = 30;

export const GET = (async ({platform, locals}) => {
    const meta = platform?.env?.META;
    if(!meta) throw error(503, "KV not available!");

    const totalStart = Date.now();

    const earliest = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("earliest", {type: "json", cacheTtl});
        locals.addTiming({id: "earliest", duration: Date.now() - start})
        return r;
    })()

    const longestPreShow = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("longestPreShow", {type: "json", cacheTtl});
        locals.addTiming({id: "lps", duration: Date.now() - start})
        return r;
    })();

    const longestShow = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("longestShow", {type: "json", cacheTtl});
        locals.addTiming({id: "ls", duration: Date.now() - start})
        return r;
    })();

    const mostLate = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("mostLate", {type: "json", cacheTtl});
        locals.addTiming({id: "ml", duration: Date.now() - start})
        return r;
    })();

    const r = {
        earliest: await earliest,
        longestPreShow: await longestPreShow,
        longestShow: await longestShow,
        mostLate: await mostLate
    };
    locals.addTiming({id: "total", duration: Date.now() - totalStart});
    return json(r)
}) satisfies RequestHandler;