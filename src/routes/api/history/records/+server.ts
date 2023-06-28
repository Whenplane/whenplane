import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";

export const GET = (async ({platform, locals}) => {
    const meta = platform?.env?.META;
    if(!meta) throw error(503, "KV not available!");
    let start = Date.now();
    const times: {[key: string]: number} = {};

    const closest = await meta.get("closest", {type: "json"});
    locals.addTiming({id: "closest", duration: Date.now() - start})
    start = Date.now();

    const longestPreShow = await meta.get("longestPreShow", {type: "json"});
    locals.addTiming({id: "lps", duration: Date.now() - start})
    start = Date.now();

    const longestShow = await meta.get("longestShow", {type: "json"});
    locals.addTiming({id: "ls", duration: Date.now() - start})
    start = Date.now();

    const mostLate = await meta.get("mostLate", {type: "json"});
    locals.addTiming({id: "ml", duration: Date.now() - start})

    return json({closest, longestPreShow, longestShow, mostLate}, )
}) satisfies RequestHandler;