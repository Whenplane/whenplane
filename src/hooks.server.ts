import type {Handle} from "@sveltejs/kit";
import {dev} from "$app/environment";

const reportedIds: {[key: string]: number} = {};

export const handle: Handle = async ({ event, resolve }) => {
    // KV in dev
    if (dev) {
        const { fallBackPlatformToMiniFlareInDev } = await import('$lib/server/clients/miniflare');
        event.platform = await fallBackPlatformToMiniFlareInDev(event.platform);
    }

    const timings: TimingEntry[] = [];

    event.locals.addTiming = (timing: TimingEntry) => {
        timings.push(timing)
    }

    let id = event.cookies.get("id");
    if(!id) {
        id = crypto.randomUUID();
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);

        event.cookies.set("id", id, {
            path: "/",
            expires
        });
    }

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

    if(event.platform?.context?.waitUntil) {
        const data = {
            site: "wheniswan",
            ua: event.request.headers.get("User-Agent"),
            url: event.url,
            id
        };
        console.log({data});
        if(!dev) {
            event.platform.context.waitUntil(
                (async () => {
                    if(reportedIds[id] && reportedIds[id] + (1000 * 60) > Date.now()) return;
                    reportedIds[id] = Date.now();
                    await fetch("https://stats.ajg0702.us/report", {
                        method: "POST",
                        body: JSON.stringify(data)
                    })
                })()
            );
        }
    }

    return response;
}