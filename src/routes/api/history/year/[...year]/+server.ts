import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import { type HistoricalEntry, removeAfterLastDash, type OldShowMeta, type YoutubeSnippet } from "$lib/utils.ts";
import {history as historicalShows} from "$lib/history/oldHistory";
import type { KVNamespace } from "@cloudflare/workers-types";

const cacheTtl = 60 * 60 * 24 * 6; // cache single keys for 6 days if possible

const CURRENT_YEAR_CACHE = 60e3; // cache the current year for 60 seconds
const OTHER_CACHE = 60 * 60e3; // cache other years for 60 minutes

const cache: {
    [key: string]: {
        lastFetch: number,
        lastData: HistoricalEntry[]
    }
} = {};

export const GET = (async ({platform, params, locals, fetch}) => {
    const history: KVNamespace = platform?.env?.HISTORY;
    if(!history) throw error(503, "History not available");

    const yearRaw = params.year;
    if(!yearRaw) throw error(400, "Need a year!");
    const years = yearRaw.split(",");


    const cache_time = years.includes(new Date().getUTCFullYear()) ? CURRENT_YEAR_CACHE : OTHER_CACHE;

    const fetchDistance = Date.now() - (cache[yearRaw]?.lastFetch ?? 0);
    if(fetchDistance < cache_time) {
        return json(cache[yearRaw].lastData, {
            headers: {
                "x-cached": "true",
                "x-fetch-distance": fetchDistance
            }
        });
    }

    if(cache[yearRaw]?.lastData) {
        cache[yearRaw].lastFetch = Date.now();
    }



    const keyNames: string[] = []

    const keyPromises: Promise<HistoricalEntry>[] = [];

    let lists = 0;

    const start = Date.now();

    const listPromises = [];

    for (const year of years) {
        listPromises.push((async () => {
            let list_complete = false;
            let cursor: string | undefined = undefined;
            while(!list_complete) {
                const listStart = Date.now();
                const list: KVListResponse<OldShowMeta> = await history.list<OldShowMeta>({
                    prefix: year == "all" ? undefined : year+"",
                    cursor
                });

                locals.addTiming({
                    id: "list" + lists,
                    description: "List #" + (lists + 1),
                    duration: Date.now() - listStart
                });

                lists++;

                for(const k of list.keys) {
                    keyNames.push(k.name);
                }

                for (const k of list.keys) {
                    if(k.name.includes(":")) {
                        const parts = k.name.split(":");
                        if(keyNames.includes(parts[0])) continue;

                        keyNames.push(parts[0]);
                        keyPromises.push((async () => {
                            const preStart = history.get(parts[0] + ":preShowStart", {cacheTtl});
                            const mainStart = history.get(parts[0] + ":mainShowStart", {cacheTtl});
                            const mainEnd = history.get(parts[0] + ":showEnd", {cacheTtl});
                            const snippet: Promise<YoutubeSnippet | null> = history.get(parts[0] + ":snippet", {cacheTtl, type: "json"});
                            let isCurrentlyLive: Promise<boolean>;
                            if(Date.now() - new Date(parts[0]).getTime() < 35 * 60 * 60e3) {
                                isCurrentlyLive = fetch("/api/twitch?fast=true").then(r => r.json())
                                  .then(d => !!d.isWAN)
                            } else {
                                isCurrentlyLive = Promise.resolve(false);
                            }
                            return {
                                name: parts[0],
                                metadata: {
                                    preShowStart: await preStart,
                                    mainShowStart: await mainStart,
                                    showEnd: await mainEnd,
                                    snippet: await snippet,
                                    title: await (async () => {
                                        const rawTitle = (await snippet)?.title;
                                        if(!rawTitle) return rawTitle;

                                        return removeAfterLastDash(rawTitle)
                                    })(),
                                    isCurrentlyLive: await isCurrentlyLive
                                }
                            }
                        })());
                    } else if(!k.metadata) {
                        keyPromises.push((async () => {
                            return {
                                name: k.name,
                                metadata: (await history.get(k.name, {type: 'json', cacheTtl}) as unknown as OldShowMeta)
                            }
                        })());
                    } else {
                        keyPromises.push(Promise.resolve(k));
                    }
                }
                list_complete = list.list_complete;
                cursor = list.cursor;
            }

            if(Number(year) <= 2023) {
                for (const historicalShow of historicalShows) {
                    if(!historicalShow.name.startsWith(year)) continue;
                    if(keyNames.includes(historicalShow.name)) continue;
                    keyNames.push(historicalShow.name);
                    keyPromises.push(Promise.resolve(historicalShow));
                }
            }
        })())
    }

    await Promise.all(listPromises);

    const afterLoopStart = Date.now();

    let keys = await Promise.all(keyPromises);

    locals.addTiming({id: "afterLoop", duration: Date.now() - afterLoopStart});

    keys = keys.sort((a, b) => new Date(b.name).getTime() - new Date(a.name).getTime());

    locals.addTiming({id: "total", duration: Date.now() - start});

    cache[yearRaw] = {
        lastFetch: Date.now(),
        lastData: keys
    }

    return json(keys, {
        headers: {
            "X-Lists": lists+""
        }
    });

}) satisfies RequestHandler;