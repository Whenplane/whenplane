import type {PageLoad} from "./$types";
import {browser} from "$app/environment";

let cachedLatenesses: number;
let cachedHasDone: boolean;
let cachedMainShowStarted: string;

export const load = (async ({fetch, url}) => {
    const fast = (!browser || (location && location.pathname !== "/"));
    const cacheBuster = fast ? "" : "&r=" + Date.now();
    const hasDonePromise = fetch("/api/hasDone").then(r => r.json());
    const liveStatus = await fetch("/api/aggregate?fast=" + fast + cacheBuster)
        .then(r => r.json());

    const isPreShow = !liveStatus.youtube.isWAN && liveStatus.twitch.isWAN;
    const isMainShow = liveStatus.youtube.isWAN;

    const preShowStarted = isPreShow ? liveStatus.twitch.started : undefined;
    const mainShowStarted = isMainShow ? liveStatus.youtube.started : undefined;


    const hasDone = (await hasDonePromise).hasDone;

    let latenesses;

    if(browser) {
        if(!cachedLatenesses && !cachedHasDone && !cachedMainShowStarted) {
            cachedLatenesses = await getAverageLateness(fetch);
            cachedHasDone = hasDone;
            cachedMainShowStarted = mainShowStarted;

            latenesses = cachedLatenesses;
        } else {
            if(hasDone == cachedHasDone && cachedMainShowStarted == mainShowStarted) {
                latenesses = cachedLatenesses;
            } else {
                console.log({hasDone, cachedHasDone, cachedMainShowStarted, mainShowStarted})
                cachedLatenesses = await getAverageLateness(fetch);
                cachedHasDone = hasDone;
                cachedMainShowStarted = mainShowStarted;

                latenesses = cachedLatenesses;
            }
        }
    } else {
        latenesses = await getAverageLateness(fetch);
    }

    return {
        isPreShow,
        isMainShow,
        liveStatus,
        preShowStarted,
        mainShowStarted,
        fast,
        hasDone,
        averageLateness: latenesses.averageLateness,
        medianLateness: latenesses.medianLateness
    }
}) satisfies PageLoad;


async function getAverageLateness(fetch: fetchFunction) {
    return await fetch("/api/latenesses")
      .then(r => r.json());
}

type fetchFunction = typeof fetch