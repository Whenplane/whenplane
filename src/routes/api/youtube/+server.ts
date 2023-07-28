import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {getClosestWan, getUTCDate} from "$lib/timeUtils";
import {dev} from "$app/environment";

const cacheTime = 5000; // Fetch from fetcher no more than once every 5 seconds


const cache: {
    lastFetch: number,
    value?: {
        isLive: boolean,
        isWAN: boolean,
        started?: string
    }
} = {
    lastFetch: 0
}

let savedStartTime: boolean | undefined = undefined;

export const GET = (async ({platform, locals, url}) => {

    const history = platform?.env?.HISTORY;
    const fetcher = platform?.env?.FETCHER;
    if(!history) throw error(503, "History not available");
    if(!platform?.context) throw error(503, "Request context not available!");

    const fast = url.searchParams.get("fast") === "true";

    const fetchDistance = Date.now() - cache.lastFetch;
    if(
        fetchDistance < cacheTime ||
        // With the fast flag (added for initial page load requests), always fetch cached data if its from within the past 5 hours
        (fast && cache.value && fetchDistance < 5 * 60 * 60e3)
    ) {
        return json({...cache.value, cached: true, fetchDistance});
    }

    cache.lastFetch = Date.now();

    let stub: {fetch: typeof fetch};
    if(fetcher) {
        const id = await fetcher.idFromName("youtube");
        stub = await fetcher.get(id, {locationHint: 'wnam'});
    } else if(dev) {
        stub = {fetch};
    } else {
        throw error(503, "Fetcher not available");
    }

    const doStart = Date.now();
    const {isLive, isWAN, started, videoId, snippet} = await stub.fetch("https://wheniswan-fetcher.ajg.workers.dev/youtube")
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        .then(r => r.json());
    locals.addTiming({id: 'doFetch', duration: Date.now() - doStart})

    if(!savedStartTime && isWAN) {
        const closestWAN = getClosestWan();
        const distance = Math.abs(Date.now() - closestWAN.getTime())
        // Only record show start time if we are within 7 hours of the closest wan
        if(distance < 7 * 60 * 60 * 1000) {
            platform.context.waitUntil((async () => {
                const kvStartTime = await history.get(getUTCDate(closestWAN) + ":mainShowStart");
                if(!kvStartTime) {
                    // Expire these keys after 15 days to save space over time.
                    // It should be collapsed into a single object at the end of the stream, so no data should be lost.
                    // The collapsing is done in a scheduled worker
                    const expirationTtl = 15 * 24 * 60 * 60
                    const date = getUTCDate(getClosestWan());
                    await history.put(date + ":mainShowStart", started, {expirationTtl});
                    await history.put(date + ":videoId", videoId, {expirationTtl});
                    await history.put(date + ":snippet", snippet, {expirationTtl});
                }
            })());
            savedStartTime = true;
        }
    }


    const result = {
        isLive,
        isWAN,
        started,
        videoId
    };

    cache.value = result

    return json(result)

}) satisfies RequestHandler;