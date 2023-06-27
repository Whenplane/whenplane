import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";

export const GET = (async ({platform}) => {
    const meta = platform?.env?.META;
    if(!meta) throw error(503, "KV not available!");
    return json({
        closest: await meta.get("closest", {type: "json"}),
        longestPreShow: await meta.get("longestPreShow", {type: "json"}),
        longestShow: await meta.get("longestShow", {type: "json"}),
        mostLate: await meta.get("mostLate", {type: "json"})
    })
}) satisfies RequestHandler;