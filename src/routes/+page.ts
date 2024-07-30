import type {PageLoad} from "./$types";
import { browser, dev } from "$app/environment";
import type { Latenesses } from "./api/latenesses/+server";
import type { AggregateResponse } from "./api/(live-statuses)/aggregate/+server";
import { nextFast, overwriteData } from "$lib/stores.ts";
import type { NewsPost } from "$lib/news/news.ts";

let cachedLatenesses: Latenesses;
let cachedLatenessesTime = 0 ;


let lastNewsPostCache: NewsPost;

export const load = (async ({fetch, params, url}) => {
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

    /* wdb live stuff
    const isWdbResponseValid = liveStatus &&
      typeof liveStatus?.floatplane?.live === "boolean" &&
        (liveStatus?.floatplane?.live || liveStatus?.twitch.isLive) ? (
        liveStatus.twitch.isWAN === liveStatus.floatplane.isWAN &&
        liveStatus.twitch.isLive === liveStatus.floatplane.live
      ) : true;
    if(!isWdbResponseValid && liveStatus && dev) {
        console.debug("wdb api response invalid!", {
            typeofLive: typeof liveStatus?.floatplane?.live,
            twitch: liveStatus.twitch.isWAN,
            fp: liveStatus?.floatplane?.isWAN,
            fpState: liveStatus?.floatplane
        })
    }
    if(liveStatus?.floatplane && Date.now() - get(wdbSocketState).lastReceive > 300e3) floatplaneState.set(liveStatus?.floatplane)*/

    if(liveStatus && overwriteData.data) {

        console.debug("Before overwrite", JSON.parse(JSON.stringify(liveStatus)), "with", overwriteData);

        liveStatus.youtube = {...liveStatus.youtube, ...overwriteData.data.youtube};
        liveStatus.twitch = {...liveStatus.twitch, ...overwriteData.data.twitch};
        liveStatus.specialStream = overwriteData.data.specialStream ?? liveStatus.specialStream;
        liveStatus.floatplane = {...liveStatus.floatplane, ...overwriteData.data.floatplane};
        liveStatus.notablePeople = {...liveStatus.notablePeople, ...overwriteData.data.notablePeople};
        liveStatus.hasDone = overwriteData.data.hasDone;
        liveStatus.isThereWan = overwriteData.data.isThereWan;
        liveStatus.votes = overwriteData.data.votes ?? liveStatus.votes;

        console.debug("After overwrite", JSON.parse(JSON.stringify(liveStatus)));

        overwriteData.data = undefined;
    }


    const isPreShow = liveStatus ? (!liveStatus.youtube.isLive && (liveStatus.twitch.isWAN || (liveStatus.floatplane.isWAN && liveStatus.floatplane.isLive))) : false;
    const isMainShow = liveStatus ? (liveStatus.youtube.isWAN && liveStatus.youtube.isLive) : false;

    const preShowStarted = liveStatus && isPreShow ? liveStatus.twitch.started : undefined;
    const mainShowStarted = liveStatus && isMainShow ? liveStatus.youtube.started : undefined;

    return {
        isPreShow,
        isMainShow,
        liveStatus,
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
        // TODO: when making WS default, set to false if 'poll' searchParam is set
        useWebSocket: url.searchParams.has("ws"),
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