import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {dev} from "$app/environment";
import {random, wait} from "../../../../lib/utils";

// Cache in edge for 2 hours
const cacheTtl = 60 * 60 * 2;

export const GET = (async ({platform, locals}) => {
    const meta = platform?.env?.META;
    if(!meta) throw error(503, "KV not available!");
    const times: {[key: string]: number} = {};

    const closest = await (async () => {
        const start = Date.now();
        if(dev) await wait(random(5, 80))
        const r = await meta.get("closest", {type: "json", cacheTtl});
        locals.addTiming({id: "closest", duration: Date.now() - start})
        return r;
    })()

    const longestPreShow = (async () => {
        const start = Date.now();
        if(dev) await wait(random(5, 80))
        const r = await meta.get("longestPreShow", {type: "json", cacheTtl});
        locals.addTiming({id: "lps", duration: Date.now() - start})
        return r;
    })();

    const longestShow = (async () => {
        const start = Date.now();
        if(dev) await wait(random(5, 80))
        const r = await meta.get("longestShow", {type: "json", cacheTtl});
        locals.addTiming({id: "ls", duration: Date.now() - start})
        return r;
    })();

    const mostLate = (async () => {
        const start = Date.now();
        if(dev) await wait(random(5, 80))
        const r = await meta.get("mostLate", {type: "json", cacheTtl});
        locals.addTiming({id: "ml", duration: Date.now() - start})
        return r;
    })();

    return json({
        closest: await closest,
        longestPreShow: await longestPreShow,
        longestShow: await longestShow,
        mostLate: await mostLate
    })
}) satisfies RequestHandler;