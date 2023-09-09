import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";

const cacheTtl = 60 * 60 * 24 * 6; // cache single keys for 6 days if possible

export const GET = (async ({platform, params, locals, fetch}) => {
    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "History not available");

    const year = params.year;
    if(!year) throw error(400, "Need a year!");

    const keyNames: string[] = []

    const keyPromises: Promise<Key>[] = [];
    let list_complete = false;
    let cursor: string | undefined = undefined;

    let lists = 0;

    const start = Date.now();

    while(!list_complete) {
        const listStart = Date.now();
        const list: KVListResponse = await history.list({
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
                    const snippet = history.get(parts[0] + ":snippet", {cacheTtl, type: "json"});
                    let isCurrentlyLive: Promise<boolean>;
                    if(new Date(parts[0]).getDate() === new Date().getDate()) {
                        isCurrentlyLive = fetch("/api/twitch").then(r => r.json())
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

                                const parts = rawTitle.split(" - ");
                                parts.pop(); // do a pop to only remove the stuff after the *last* dash
                                return parts.join(" - ");
                            })(),
                            isCurrentlyLive: await isCurrentlyLive
                        }
                    }
                })());
            } else if(!k.metadata) {
                keyPromises.push((async () => {
                    return {
                        name: k.name,
                        metadata: await history.get(k.name, {type: 'json', cacheTtl})
                    }
                })());
            } else {
                keyPromises.push(Promise.resolve(k));
            }
        }
        list_complete = list.list_complete;
        cursor = list.cursor;
    }

    const afterLoopStart = Date.now();

    let keys = await Promise.all(keyPromises);

    locals.addTiming({id: "afterLoop", duration: Date.now() - afterLoopStart});

    keys = keys.sort((a, b) => new Date(b.name).getTime() - new Date(a.name).getTime());

    locals.addTiming({id: "total", duration: Date.now() - start});

    return json(keys, {
        headers: {
            "X-Lists": lists+""
        }
    });

}) satisfies RequestHandler;

type Key = {
    name: string,
    metadata: {
        [key: string]: string | number | boolean
    }
}