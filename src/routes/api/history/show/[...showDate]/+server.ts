import { type RequestHandler } from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import type {OldShowMeta} from "$lib/utils";
import type {KVNamespace} from "@cloudflare/workers-types";
import { dateToNumber, getPreviousWAN, getUTCDate } from "$lib/timeUtils.ts";

export const GET = (async ({platform, params, url, locals}) => {

    const history: KVNamespace | undefined = platform?.env?.HISTORY;
    if(!history) throw error(503, "History missing!");

    let showDate = params.showDate;
    if(!showDate) throw error(400, "No show date!");

    const youtubeToDate = platform?.env?.YOUTUBE_TO_DATE;
    if(showDate && !showDate.includes("/") && youtubeToDate) {
        const date = await youtubeToDate.get(showDate);
        if(date) {
            showDate = date;
        }
    }

    if(!platform) throw error(503, "No platform!");

    // If this show is from before the previous show, then use a large cacheTtl (90 days, even though it would probably be evicted before then most of the time)
    const cacheTtl = dateToNumber(showDate) < dateToNumber(getUTCDate(getPreviousWAN())) ? 90 * 24 * 60 * 60 : undefined;

    const start = Date.now();

    const startKVFetch = Date.now();
    const kvShowInfo = await history.getWithMetadata<OldShowMeta, OldShowMeta>(showDate, {type: 'json', cacheTtl});

    if(kvShowInfo.value) {
        console.log("Got exact key match");
        let generatedMetadata = false
        if(!kvShowInfo.metadata) {
            kvShowInfo.metadata = structuredClone(kvShowInfo.value);
            kvShowInfo.metadata.snippet = undefined;
            generatedMetadata = true;
        }

        locals.addTiming({id: "kv", duration: Date.now() - startKVFetch})

        locals.addTiming({id: "total", duration: Date.now() - start});

        return json({
            name: showDate,
            metadata: kvShowInfo.metadata,
            value: kvShowInfo.value,
        }, {headers: {"X-Generated-Metadata": generatedMetadata+""}});
    }

    const oldHistory = await import("$lib/history/oldHistory.ts");
    for (const oldShow of oldHistory.history) {
        if(oldShow.name == showDate) {
            console.log("Got history match")
            oldShow.value = structuredClone(oldShow.metadata)
            return json(oldShow);
        }
    }


    const preShowStartFragment = await history.get(showDate + ":preShowStart");
    if(preShowStartFragment) {
        const mainShowStartFragment = history.get(showDate + ":mainShowStart");
        const showEndFragment = history.get(showDate + ":showEnd");
        const snippetFragment = history.get(showDate + ":snippet", {type: 'json'});
        const videoIdFragment = history.get(showDate + ":videoId");

        if(url.searchParams.has("allowPreshowOnly") || await mainShowStartFragment || await showEndFragment || await snippetFragment || await videoIdFragment) {
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

            console.log("Returning fragmented key match")

            return json({
                name: showDate,
                metadata,
                value
            })
        }
    }

    throw error(404, "Show not found")
}) satisfies RequestHandler;