import {json, type RequestHandler} from "@sveltejs/kit";
import {history} from "$lib/oldHistory";

export const GET = (async ({url}) => {
    const oldShows = [...history];
    if(url.searchParams.has("removeDescription")) {
        for (const show of oldShows) {
            if(show.metadata.snippet?.description) {
                show.metadata.snippet.description = undefined;
            }
            if(show.metadata.snippet?.localized) {
                show.metadata.snippet.localized = undefined;
            }
        }
    }
    return json(oldShows);
}) satisfies RequestHandler;