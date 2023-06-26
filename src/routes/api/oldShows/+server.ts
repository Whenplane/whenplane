import {json, type RequestHandler} from "@sveltejs/kit";
import {history} from "$lib/oldHistory";

export const GET = (async () => {
    return json(history);
}) satisfies RequestHandler;