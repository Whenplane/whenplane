import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import type {OldShowMeta} from "$lib/utils";
import type {KVNamespace} from "@cloudflare/workers-types";

export const GET = (async ({platform, params}) => {

    const history: KVNamespace = platform?.env?.HISTORY;
    if(!history) throw error(503, "History missing!");

    const showDate = params.showDate;
    if(!showDate) throw error(400, "No show date!");

    const kvShowInfo = await history.getWithMetadata<OldShowMeta, OldShowMeta>(showDate, {type: 'json'});

    if(kvShowInfo.value) {
        let generatedMetadata = false
        if(!kvShowInfo.metadata) {
            kvShowInfo.metadata = structuredClone(kvShowInfo.value);
            kvShowInfo.metadata.snippet = undefined;
            generatedMetadata = true;
        }
        return json({
            name: params.showDate,
            metadata: kvShowInfo.metadata,
            value: kvShowInfo.value
        }, {headers: {"X-Generated-Metadata": generatedMetadata+""}});
    }

    const preShowStartFragment = history.get(params.showDate + ":preShowStart");
    const mainShowStartFragment = history.get(params.showDate + ":mainShowStart");
    const showEndFragment = history.get(params.showDate + ":showEnd");
    const snippetFragment = history.get(params.showDate + ":snippet", {type: 'json'});
    const videoIdFragment = history.get(params.showDate + ":videoId");

    if(await preShowStartFragment || await mainShowStartFragment || await showEndFragment || await snippetFragment || await videoIdFragment) {
        const preShowStart = await preShowStartFragment;
        const mainShowStart = await mainShowStartFragment;
        const showEnd = await showEndFragment;
        const snippet = await snippetFragment as OldShowMeta["snippet"] | undefined;
        const videoId = await videoIdFragment;

        const title = snippet?.title ? snippet.title.split(" - ")[0] : undefined;

        const metadata = {
            preShowStart,
            mainShowStart,
            showEnd,
            title,
            thumbnails: snippet?.thumbnails,
            vods: {
                youtube: videoId
            }
        }
        const value = {
            ...metadata,
            snippet
        }
        return json({
            name: showDate,
            metadata,
            value
        })
    }

    const oldHistory = await import("$lib/history/oldHistory.ts");
    for (const oldShow of oldHistory.history) {
        if(oldShow.name == params.showDate) {
            oldShow.value = structuredClone(oldShow.metadata)
            return json(oldShow);
        }
    }

    throw error(404, "Show not found")
}) satisfies RequestHandler;