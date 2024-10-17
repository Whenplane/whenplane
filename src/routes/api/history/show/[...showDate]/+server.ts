import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import type {OldShowMeta} from "$lib/utils";
import type {KVNamespace} from "@cloudflare/workers-types";
import { version } from "$app/environment";
import type { WanDb_Episode } from "$lib/wdb_types.ts";

export const GET = (async ({platform, params, url, locals}) => {

    const history: KVNamespace | undefined = platform?.env?.HISTORY;
    if(!history) throw error(503, "History missing!");

    const episode_cache: KVNamespace | undefined = platform?.env?.WDB_EPISODE_CACHE;
    if(!episode_cache) throw error(503, "WDB episode cache missing!");

    const showDate = params.showDate;
    if(!showDate) throw error(400, "No show date!");

    if(!platform) throw error(503, "No platform!");

    const fetchWdbData = url.searchParams.get("wdb") === "true";
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

        const startWdbFetch = Date.now();
        const id = kvShowInfo.metadata?.vods?.youtube ?? kvShowInfo.value.vods?.youtube;
        const wdb = fetchWdbData && id ? await getWdbData(id, episode_cache, platform) : undefined;
        locals.addTiming({id: "wdb", duration: Date.now() - startWdbFetch});

        locals.addTiming({id: "total", duration: Date.now() - start});

        return json({
            name: params.showDate,
            metadata: kvShowInfo.metadata,
            value: kvShowInfo.value,
            wdb
        }, {headers: {"X-Generated-Metadata": generatedMetadata+""}});
    }

    const oldHistory = await import("$lib/history/oldHistory.ts");
    for (const oldShow of oldHistory.history) {
        if(oldShow.name == params.showDate) {
            oldShow.value = structuredClone(oldShow.metadata)
            const id = oldShow.metadata?.vods?.youtube;
            const wdb = fetchWdbData && id ? await getWdbData(id, episode_cache, platform) : undefined;
            return json({
                ...oldShow,
                wdb
            });
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

            const startWdbFetch = Date.now();
            const id = metadata?.vods?.youtube;
            const wdb = fetchWdbData && id ? await getWdbData(id, episode_cache, platform) : undefined;
            locals.addTiming({id: "wdb", duration: Date.now() - startWdbFetch});

            locals.addTiming({id: "total", duration: Date.now() - start});


            return json({
                name: showDate,
                metadata,
                value,
                wdb
            })
        }
    }

    throw error(404, "Show not found")
}) satisfies RequestHandler;


const wdb_cache: {
    [id: string]: {
        lastFetch: number,
        lastData: WanDb_Episode
    }
} = {};

async function getWdbData(youtubeId: string, episode_cache: KVNamespace, platform: App.Platform) {
    return null; // TheWANDb is dead for now

    /*const lastFetch = wdb_cache[youtubeId]?.lastFetch ?? 0;

    if(Date.now() - lastFetch < 60 * 60e3) { // cache for up to an hour
        return wdb_cache[youtubeId]?.lastData;
    }

    if(wdb_cache[youtubeId]?.lastFetch) wdb_cache[youtubeId].lastFetch = Date.now();

    const cached = episode_cache.get<WanDb_Episode>(youtubeId, {type: 'json'});
    const wdb_response = fetch("https://edge.thewandb.com/v2/episodes/" + youtubeId, {
        headers: {
            "Referer": "Whenplane/" + version,
            "x-whenplane-version": version
        }
    })
      .then(async r => {
          if(!r.ok) {
              console.warn(`Received ${r.status} ${r.statusText} from thewandb`, await r.text());
              return null;
          }
          return r;
      })
      .then(r => r != null ? r.json() : r)
      .catch(e => {
          console.warn("Error while fetching from thewandb:", e);
          return null;
      })

    let result = await Promise.any([cached, wdb_response]);
    if(!result) result = await wdb_response;

    if(result || !wdb_cache[youtubeId]?.lastData) { // only write a null to the cache if we didn't already have data
        wdb_cache[youtubeId] = {
            lastFetch: Date.now(),
            lastData: result
        }


        platform.context?.waitUntil((async () => {
            if(!(await cached) && result) {
                await episode_cache.put(
                  youtubeId,
                  JSON.stringify(result),
                  {
                      expirationTtl: 30 * 24 * 60 * 60 // keep kv cache for 30 days
                  }
                )
            }
        })());

    }

    return result;*/
}