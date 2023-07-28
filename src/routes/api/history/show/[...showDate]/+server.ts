import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";

export const GET = (async ({platform, params}) => {

    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "History missing!");

    const kvShowInfo = await history.getWithMetadata(params.showDate, {type: 'json'});

    if(kvShowInfo.value) {
        if(!kvShowInfo.metadata) {
            kvShowInfo.metadata = structuredClone(kvShowInfo.value);
            kvShowInfo.metadata.snippet = undefined;
        }
        return json({
            name: params.showDate,
            metadata: kvShowInfo.metadata,
            value: kvShowInfo.value
        });
    }

    const oldHistory = await import("$lib/oldHistory");
    for (const oldShow of oldHistory.history) {
        if(oldShow.name == params.showDate) {
            return json(oldShow);
        }
    }

    throw error(404, "Show not found")
}) satisfies RequestHandler;