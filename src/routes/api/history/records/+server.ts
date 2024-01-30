import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {dev} from "$app/environment";
import {random, wait} from "$lib/utils";
import type { KVNamespace } from "@cloudflare/workers-types";

// Cache KV in edge for 2 hours
const cacheTtl = 60 * 60 * 2;

// In dev, random test latencies are used
const testMin = 5;
const testMax = 30;

let cache: {
    lastFetch: number,
    lastData?: Records
} = {lastFetch: 0};

export const GET = (async ({platform, locals}) => {
    const meta: KVNamespace | undefined = platform?.env?.META;
    if(!meta) throw error(503, "KV not available!");

    if(Date.now() - cache.lastFetch < 60e3) { // cache for 1 minute
        return json(cache.lastData);
    }
    if(cache.lastData) cache.lastFetch = Date.now();

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

    const shortestPreShow = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("shortestPreShow", {type: "json", cacheTtl});
        locals.addTiming({id: "sps", duration: Date.now() - start})
        return r;
    })();

    const longestShow = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("longestShow", {type: "json", cacheTtl});
        locals.addTiming({id: "ls", duration: Date.now() - start})
        return r;
    })();

    const shortestShow = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("shortestShow", {type: "json", cacheTtl});
        locals.addTiming({id: "ss", duration: Date.now() - start})
        return r;
    })();

    const mostLate = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("mostLate", {type: "json", cacheTtl});
        locals.addTiming({id: "ml", duration: Date.now() - start})
        return r;
    })();

    const averageLateness = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("averageLateness", {type: "json", cacheTtl});
        locals.addTiming({id: "al", duration: Date.now() - start})
        return r as number;
    })();

    const medianLateness = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("medianLateness", {type: "json", cacheTtl});
        locals.addTiming({id: "mel", duration: Date.now() - start})
        return r as number;
    })();

    const lateStreak = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("lateStreak", {type: "json", cacheTtl});
        locals.addTiming({id: "lst", duration: Date.now() - start})
        return r as number;
    })();

    const showStreak = (async () => {
        const start = Date.now();
        if(dev) await wait(random(testMin, testMax))
        const r = await meta.get("showStreak", {type: "json", cacheTtl});
        locals.addTiming({id: "sst", duration: Date.now() - start})
        return r as number;
    })();

    const r: Records = {
        earliest: await earliest,
        longestPreShow: await longestPreShow,
        shortestPreShow: await shortestPreShow,
        longestShow: await longestShow,
        shortestShow: await shortestShow,
        mostLate: await mostLate,
        averageLateness: await averageLateness,
        medianLateness: await medianLateness,
        lateStreak: await lateStreak,
        showStreak: await showStreak
    };

    cache = {
        lastFetch: Date.now(),
        lastData: r
    }
    locals.addTiming({id: "total", duration: Date.now() - totalStart});
    return json(r)
}) satisfies RequestHandler;

type Records = {
    averageLateness: number;
    lateStreak: number;
    showStreak: number;
    longestShow: unknown;
    shortestShow: unknown;
    earliest: unknown;
    longestPreShow: unknown;
    shortestPreShow: unknown;
    mostLate: unknown;
    medianLateness: number
}