import { redirect, type RequestHandler } from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import type {OldShowMeta} from "$lib/utils";
import type {KVNamespace} from "@cloudflare/workers-types";

export const GET = (async ({platform, params, url, locals}) => {

    const history: KVNamespace | undefined = platform?.env?.HISTORY;
    if(!history) throw error(503, "History missing!");

    const showDate = params.showDate;
    if(!showDate) throw error(400, "No show date!");

    const youtubeToDate = platform?.env?.YOUTUBE_TO_DATE;
    if(params.showDate && !params.showDate.includes("/") && youtubeToDate) {
        const date = await youtubeToDate.get(params.showDate);
        if(date) {
            throw redirect(301, "/api/history/show/" + date + (url.searchParams.get("hash") ?? ""));
        }
    }

    if(!platform) throw error(503, "No platform!");

    const start = Date.now();

    const startKVFetch = Date.now()
    const kvShowInfo = await history.getWithMetadata<OldShowMeta, OldShowMeta>(showDate, {type: 'json'});

    if(kvShowInfo.value) {
        let generatedMetadata = false
        if(!kvShowInfo.metadata) {
            kvShowInfo.metadata = structuredClone(kvShowInfo.value);
            kvShowInfo.metadata.snippet = undefined;
            generatedMetadata = true;
        }

        locals.addTiming({id: "kv", duration: Date.now() - startKVFetch})

        locals.addTiming({id: "total", duration: Date.now() - start});

        return json({
            name: params.showDate,
            metadata: kvShowInfo.metadata,
            value: kvShowInfo.value,
        }, {headers: {"X-Generated-Metadata": generatedMetadata+""}});
    }

    const oldHistory = await import("$lib/history/oldHistory.ts");
    for (const oldShow of oldHistory.history) {
        if(oldShow.name == params.showDate) {
            oldShow.value = structuredClone(oldShow.metadata)
            return json(oldShow);
        }
    }


    const preShowStartFragment = await history.get(params.showDate + ":preShowStart");
    if(preShowStartFragment) {
        const mainShowStartFragment = history.get(params.showDate + ":mainShowStart");
        const showEndFragment = history.get(params.showDate + ":showEnd");
        const snippetFragment = history.get(params.showDate + ":snippet", {type: 'json'});
        const videoIdFragment = history.get(params.showDate + ":videoId");

        if(await mainShowStartFragment || await showEndFragment || await snippetFragment || await videoIdFragment) {
            const preShowStart = preShowStartFragment;
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

            locals.addTiming({id: "kv", duration: Date.now() - startKVFetch});

            locals.addTiming({id: "total", duration: Date.now() - start});


            return json({
                name: showDate,
                metadata,
                value
            })
        }
    }

    throw error(404, "Show not found")
}) satisfies RequestHandler;