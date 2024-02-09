import type {PageLoad} from "./$types";
import { browser, dev } from "$app/environment";
import type { Latenesses } from "./api/latenesses/+server";
import type { AggregateResponse } from "./api/(live-statuses)/aggregate/+server";
import { floatplaneState, nextFast } from "$lib/stores.ts";
import { wait } from "$lib/utils.ts";
import type { NewsPost } from "$lib/news/news.ts";
import type { WanDb_FloatplaneData } from "$lib/wdb_types.ts";
import type { NotablePeopleResponse } from "./api/(live-statuses)/notable-streams/+server.ts";
import { isNearWan } from "$lib/timeUtils.ts";

let cachedLatenesses: Latenesses;
let cachedLatenessesTime = 0 ;


let lastNewsPostCache: NewsPost;

// update every 10 minutes when in browser, otherwise 2x per second from ssr
const wdb_fp_cache_time = browser ? 10 * 60e3 : 500;

let wdbFpCache: {
    lastFetch: number,
    lastData?: WanDb_FloatplaneData
} = {lastFetch: 0}

export const load = (async ({fetch, params}) => {
    let fast = (!browser || (location && location.pathname !== "/"));
    const cacheBuster = fast ? "" : "&r=" + Date.now();

    let isNextFast = false;

    if(nextFast.nextFast) {
        nextFast.nextFast = false;
        isNextFast = true;
        fast = true;
    }

    let liveStatus: AggregateResponse | undefined;
    let latenesses: Latenesses | undefined;
    let fpState: WanDb_FloatplaneData | undefined;
    let lastNewsPost: NewsPost | undefined;

    await Promise.all([
        (async () => {


            liveStatus = await fetch("/api/aggregate?fast=" + fast + cacheBuster + "&isNextFast=" + isNextFast)
              .then(r => r.json())
              .catch(() => false);


        })(),
        (async () => {
            if(!lastNewsPostCache) {
                lastNewsPostCache = await fetch("/api/news/latest")
                  .then(r => r.json())
                  .catch(() => false);
            }
            lastNewsPost = lastNewsPostCache
        })(),
        (async () => {

            if(Date.now() - wdbFpCache.lastFetch > wdb_fp_cache_time) {
                const responsePromise = fetch("/api/floatplane")
                  .then(r => r.json() as Promise<WanDb_FloatplaneData>)
                  .catch(error => {
                      // retry in 30 seconds
                      wdbFpCache = {
                          lastFetch: Date.now() - wdb_fp_cache_time + 30e3
                      }
                      console.error("Error while fetching fp live status from thewandb:", error);
                      return false;
                  });
                // don't wait for more than 450ms for thewandb
                const response = await Promise.race([responsePromise, wait(dev ? 1000 : 450)]) as (WanDb_FloatplaneData);
                if(!response) return;
                wdbFpCache = {
                    lastFetch: Date.now(),
                    lastData: response
                }
                fpState = response;

                floatplaneState.set(fpState)
            } else {
                fpState = wdbFpCache.lastData;
            }

        })(),
        (async () => {


            if(browser) {
                // refresh latenesses once an hour
                if(Date.now() - cachedLatenessesTime > (60 * 60e3)) {
                    cachedLatenesses = await getAverageLateness(fetch) || cachedLatenesses;
                    cachedLatenessesTime = Date.now()

                    latenesses = cachedLatenesses;
                } else {
                    latenesses = cachedLatenesses
                }
            } else {
                latenesses = await getAverageLateness(fetch);
            }


        })()
    ]);

    const isPreShow = liveStatus ? (!liveStatus.youtube.isLive && liveStatus.twitch.isWAN) : false;
    const isMainShow = liveStatus ? (liveStatus.youtube.isWAN && liveStatus.youtube.isLive) : false;

    const preShowStarted = liveStatus && isPreShow ? liveStatus.twitch.started : undefined;
    const mainShowStarted = liveStatus && isMainShow ? liveStatus.youtube.started : undefined;

    const isWdbResponseValid = liveStatus && typeof fpState?.live === "boolean" && (liveStatus.twitch.isWAN == fpState.isWAN);
    if(!isWdbResponseValid && liveStatus && dev) {
        console.debug("wdb api response invalid!", {
            typeofLive: typeof fpState?.live,
            twitch: liveStatus.twitch.isWAN,
            fp: fpState?.isWAN,
            fpState
        })
    }

    return {
        isPreShow,
        isMainShow,
        liveStatus,
        isWdbResponseValid,
        fpState,
        isThereWan: liveStatus?.isThereWan,
        preShowStarted,
        mainShowStarted,
        fast,
        hasDone: liveStatus ? liveStatus.hasDone : true,
        averageLateness: latenesses?.averageLateness,
        latenessStandardDeviation: latenesses?.latenessStandardDeviation,
        medianLateness: latenesses?.medianLateness,
        notablePeople: liveStatus?.notablePeople,
        specialStream: liveStatus?.specialStream,
        lastNewsPost,
        isBot: /bot|googlebot|crawler|spider|robot|crawling/i
          .test(browser ? navigator?.userAgent : params.__h__userAgent),
    }
}) satisfies PageLoad;


async function getAverageLateness(fetch: fetchFunction) {
    return await fetch("/api/latenesses")
      .then(r => r.json())
      .catch(() => false);
}

type fetchFunction = typeof fetch