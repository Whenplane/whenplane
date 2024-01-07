import type {Handle} from "@sveltejs/kit";
import {dev} from "$app/environment";
import { random } from "$lib/utils.ts";

const reportedIds: {[key: string]: number} = {};

let devBindings: App.Platform | undefined;

export const handle: Handle = async ({ event, resolve }) => {


    let id = event.cookies.get("id");
    if(!id) {
        id = crypto.randomUUID();
        const expires = new Date();
        expires.setUTCMonth(expires.getUTCMonth() + 1);
        expires.setDate(0);
        expires.setUTCHours(0);
        expires.setUTCMinutes(0);
        expires.setUTCSeconds(random(-60, 60));

        // If the cookie is supposed to expire around wan day, delay it
        if(expires.getUTCDay() === 5 || expires.getUTCDay() === 6) {
            expires.setDate(expires.getDate() + 2);
        }

        event.cookies.set("id", id, {
            path: "/",
            expires
        });
    }

    const report_data = {
        site: "wheniswan",
        ua: event.request.headers.get("user-agent"),
        url: event.url,
        id
    };

    // KV in dev
    if (dev) {
        if(!devBindings) {
            const { fallBackPlatformToMiniFlareInDev } = await import('$lib/server/clients/miniflare');
            devBindings = await fallBackPlatformToMiniFlareInDev(event.platform);
        }
        event.platform = devBindings;
    }

    event.locals.id = id;

    const timings: TimingEntry[] = [];

    event.locals.addTiming = (timing: TimingEntry) => {
        timings.push(timing)
    }

    if(event.url.pathname === "/history") {
        event.params.__c__viewType = event.cookies.get("historyViewType")
    }

    event.params.__h__userAgent = event.request.headers.get("user-agent") ?? undefined

    const response = await resolve(event);

    if(timings.length > 0) {
        const timingStrings: string[] = [];

        for (const timing of timings) {
            if(timing.description) {
                timingStrings.push(
                    timing.id + ";" +
                    "desc=\"" + timing.description + "\";" +
                    "dur=" + timing.duration
                );
            } else {
                timingStrings.push(
                    timing.id + ";" +
                    "dur=" + timing.duration
                );
            }
        }

        response.headers.append("Server-Timing", timingStrings.join(","));
    }

    // don't try reporting if we don't have access to waitUntil, or if the request isn't from the browser
    if(event.platform?.context?.waitUntil && event.request.headers.get("host")) {
        if(!dev && report_data.ua) {
            event.platform.context.waitUntil(
                (async () => {
                    if(reportedIds[id] && reportedIds[id] + (1000 * 60) > Date.now()) return;
                    reportedIds[id] = Date.now();
                    await fetch("https://stats.ajg0702.us/report", {
                        method: "POST",
                        body: JSON.stringify(report_data)
                    })
                })()
            );
        } else if(!report_data.ua) {
            console.warn("UA is falsy! ", report_data)
        }
    }

    if(event.url.pathname === "/") {
        response.headers.set("Cache-Control", "no-store, max-age=0");
    }

    return response;
}