import type {PageLoad} from "./$types";
import {browser} from "$app/environment";
import { error } from "@sveltejs/kit";
import type { Latenesses } from "./api/latenesses/+server";
import type { AggregateResponse } from "./api/(live-statuses)/aggregate/+server";

let cachedLatenesses: Latenesses;
let cachedLatenessesTime = 0 ;

let danCache: {
    lastFetch: number,
    lastData?: DanResponse
} = {lastFetch: 0}

export const load = (async ({fetch}) => {
    const fast = (!browser || (location && location.pathname !== "/"));
    const cacheBuster = fast ? "" : "&r=" + Date.now();

    let liveStatus: AggregateResponse | undefined;
    let latenesses: Latenesses | undefined;
    let dan: DanResponse | undefined;

    await Promise.all([
        (async () => {


            liveStatus = await fetch("/api/aggregate?fast=" + fast + cacheBuster)
              .then(r => r.json());


        })(),
        (async () => {


            if(browser) {
                // refresh latenesses once an hour
                if(Date.now() - cachedLatenessesTime > (60 * 60e3)) {
                    cachedLatenesses = await getAverageLateness(fetch);
                    cachedLatenessesTime = Date.now()

                    latenesses = cachedLatenesses;
                } else {
                    latenesses = cachedLatenesses
                }
            } else {
                latenesses = await getAverageLateness(fetch);
            }


        })(),
        (async () => {

            const now = new Date();
            // don't check for dan streams on fridays after 4pm
            if(now.getUTCDay() === 5 && now.getUTCHours() >= 11) {
                dan = {
                    isLive: false,
                    bypassed: true,
                    bypassed_by: "page"
                }
            } else {
                if(Date.now() - danCache.lastFetch > 30e3) {
                    dan = (await fetch("/api/dan?short=true&fast=" + fast + "&d=" + Date.now())
                      .then(r => r.json())) as DanResponse;
                    danCache = {
                        lastFetch: Date.now(),
                        lastData: dan
                    }
                } else {
                    dan = danCache.lastData;
                }
            }




        })()
    ]);

    if(!liveStatus) throw error(500, "Missing liveStatus!");

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
        hasDone: liveStatus.hasDone,
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
    started?: string,
    title?: string,

    bypassed?: boolean,
    bypassed_by?: string
}