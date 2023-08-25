import type {PageLoad} from "./$types";
import {browser} from "$app/environment";
import { error } from "@sveltejs/kit";

let cachedLatenesses: Latenesses;
let cachedHasDone: boolean;

let danCache: {
    lastFetch: number,
    lastData?: DanResponse
} = {lastFetch: 0}

export const load = (async ({fetch, url}) => {
    const fast = (!browser || (location && location.pathname !== "/"));
    const cacheBuster = fast ? "" : "&r=" + Date.now();

    let hasDone;
    let liveStatus: any;
    let latenesses: Latenesses | undefined = undefined;
    let dan: DanResponse;

    await Promise.all([
        (async () => {


            liveStatus = await fetch("/api/aggregate?fast=" + fast + cacheBuster)
              .then(r => r.json());


        })(),
        (async () => {

            hasDone = await fetch("/api/hasDone").then(r => r.json()).then(r => r.hasDone);

            if(browser) {
                if(!cachedLatenesses && !cachedHasDone) {
                    cachedLatenesses = await getAverageLateness(fetch);
                    cachedHasDone = hasDone;

                    latenesses = cachedLatenesses;
                } else {
                    if(JSON.stringify(hasDone) == JSON.stringify(cachedHasDone)) {
                        latenesses = cachedLatenesses;
                    } else {
                        console.log({hasDone, cachedHasDone})
                        cachedLatenesses = await getAverageLateness(fetch);
                        cachedHasDone = hasDone;

                        latenesses = cachedLatenesses;
                    }
                }
            } else {
                latenesses = await getAverageLateness(fetch);
            }


        })(),
        (async () => {


            if(Date.now() - danCache.lastFetch > 31e3) {
                dan = (await fetch("/api/dan?short=true&fast=" + fast)
                  .then(r => r.json())) as DanResponse;
                danCache = {
                    lastFetch: Date.now(),
                    lastData: dan
                }
            } else {
                dan = danCache.lastData;
            }


        })()
    ]);

    if(!liveStatus) throw error(500, "Missing liveStatus!")

    const isPreShow = !liveStatus.youtube.isWAN && liveStatus.twitch.isWAN;
    const isMainShow = liveStatus.youtube.isWAN;

    const preShowStarted = isPreShow ? liveStatus.twitch.started : undefined;
    const mainShowStarted = isMainShow ? liveStatus.youtube.started : undefined;


    return {
        isPreShow,
        isMainShow,
        liveStatus,
        isThereWan: liveStatus?.isThereWan,
        preShowStarted,
        mainShowStarted,
        fast,
        hasDone,
        averageLateness: latenesses?.averageLateness,
        medianLateness: latenesses?.medianLateness,
        dan
    }
}) satisfies PageLoad;


async function getAverageLateness(fetch: fetchFunction) {
    return await fetch("/api/latenesses")
      .then(r => r.json());
}

type fetchFunction = typeof fetch

type DanResponse = {
    isLive: boolean,
    started: string,
    title: string
}

type Latenesses = {
    averageLateness: number,
    medianLateness: number
}