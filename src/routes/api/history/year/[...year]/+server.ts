import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";

export const GET = (async ({platform, params, locals}) => {
    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "History not available");

    const year = params.year;
    if(!year) throw error(400, "Need a year!");

    const keyNames: string[] = []

    let keys: {
        name: string,
        metadata: {
            [key: string]: string | number
        }
    }[] = [];
    let list_complete = false;
    let cursor: string | undefined = undefined;

    let lists = 0;

    while(!list_complete) {
        const start = Date.now();
        const list: KVListResponse = await history.list({
            prefix: year == "all" ? undefined : year+"",
            cursor
        });

        locals.addTiming({
            id: "list" + lists,
            description: "List #" + (lists + 1),
            duration: Date.now() - start
        });

        lists++;

        for (const k of list.keys) {
            if(k.name.includes(":")) {
                const parts = k.name.split(":");
                if(keyNames.includes(parts[0])) continue;

                const preStart = history.get(parts[0] + ":preShowStart");
                const mainStart = history.get(parts[0] + ":mainShowStart");
                const mainEnd = history.get(parts[0] + ":showEnd");

                keyNames.push(parts[0]);
                keys.push({
                    name: parts[0],
                    metadata: {
                        preShowStart: await preStart,
                        mainShowStart: await mainStart,
                        showEnd: await mainEnd
                    }
                });
            } else if(!k.metadata) {
                keyNames.push(k.name);
                keys.push({
                    name: k.name,
                    metadata: await history.get(k.name, {type: 'json'})
                });
            } else {
                keyNames.push(k.name)
                keys.push(k)
            }
        }
        list_complete = list.list_complete;
        cursor = list.cursor;
    }

    keys = keys.sort((a, b) => new Date(b.name).getTime() - new Date(a.name).getTime());

    return json(keys, {
        headers: {
            "X-Lists": lists+""
        }
    });

}) satisfies RequestHandler;