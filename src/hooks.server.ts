import type {Handle} from "@sveltejs/kit";
import {dev} from "$app/environment";

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
        event.cookies.set("id", id);
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
        if(!dev) {
            event.platform.context.waitUntil(
                fetch("https://stats.ajg0702.us/report", {
                    method: "POST",
                    body: JSON.stringify(data)
                })
            );
        } else {
            console.log({data});
        }
    }

    return response;
}