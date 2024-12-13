import { error, type Handle, type HandleServerError } from "@sveltejs/kit";
import { building, dev } from "$app/environment";
import { random } from "$lib/utils.ts";
import type { AnalyticsEngineDataset, KVNamespace,
    KVNamespaceGetOptions, KVNamespaceListOptions, KVNamespaceListResult, KVNamespacePutOptions } from "@cloudflare/workers-types";
import type { TimingEntry } from "./app";
import { report } from "$lib/server/instance-analytics.ts";
import { env } from "$env/dynamic/private";

const reportedIds: {[key: string]: number} = {};

let devBindings: App.Platform | undefined;

export const handle: Handle = async ({ event, resolve }) => {

    const ua = event.request.headers.get("user-agent");

    if(event.platform?.env?.REQUESTS && event.request.headers.has("host")) {
        event.platform?.env?.REQUESTS.writeDataPoint({
            blobs: [
              event.url.pathname,
              event.request.headers.get("referer") ?? event.request.headers.get("referrer"),
              ua
            ],
            doubles: [
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                event.platform.cf?.latitude,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                event.platform.cf?.longitude
            ],
            indexes: []
        })
    }


    if(!building && (!ua || ua.startsWith("Go-http-client/") || ua === "node") && ["/history", "/news"].includes(event.url.pathname)) {
        throw error(403, "You are querying an html page via automated means, when there is a better api available. Please email block@whenplane.com for more info and guidance.")
    }


    let id = event.cookies.get("id");
    if(!id) {
        id = crypto.randomUUID();
        const expires = new Date();
        expires.setUTCFullYear(expires.getUTCFullYear() + 1);
        expires.setUTCHours(0);
        expires.setUTCMinutes(0);
        expires.setUTCSeconds(random(-60, 60));

        // If the cookie is supposed to expire around a wan day, delay it
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
    } else if(event.platform) {
        event.platform = {
            ...event.platform,
            caches: caches
        }
    }

    event.locals.id = id;

    const timings: TimingEntry[] = [];

    event.locals.addTiming = (timing: TimingEntry) => {
        timings.push(timing)
    }

    if(event.url.pathname === "/history") {
        event.params.__c__viewType = event.cookies.get("historyViewType")
    }

    event.params.__c__disableNotableStreams = event.cookies.get("disableNotableStreams")

    event.params.__h__userAgent = event.request.headers.get("user-agent") ?? undefined

    if(event.platform) {
        event.platform = {
            ...event.platform,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            env: {
                ...event.platform.env,
                CACHE: createKVNamespaceWrapper(event.platform.env?.CACHE, "caches", event.platform),
                HISTORY: createKVNamespaceWrapper(event.platform.env?.HISTORY, "wheniswan_history", event.platform),
                META: createKVNamespaceWrapper(event.platform.env?.META, "wheniswan_meta", event.platform),
                WDB_EPISODE_CACHE: createKVNamespaceWrapper(event.platform.env?.WDB_EPISODE_CACHE, "thewandb_episode_cache", event.platform),
            },
        }
    }


    if(event.platform?.cf) {
        event.platform?.context?.waitUntil(report(event.platform.cf))
    } else if(!dev && !building) {
        console.warn("Missing platform or platform.cf!")
    }


    const response = await resolve(
      event,
      {
          filterSerializedResponseHeaders: (name) => name.startsWith('x-') || name.toLowerCase() === "server-timing",
      }
    );




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

export const handleError: HandleServerError = async ({ error, event, status, message}) => {

    if(!building && error && error?.status !== 404) {
        console.debug("Reporting error!", error)
        if(env.ERROR_REPORTING_WEBHOOK) {

            try {
                const formData = new FormData();

                formData.append("payload_json", JSON.stringify(
                  {
                      content: `Error thrown on whenplane server worker! Path: \`${event.url.pathname}\``
                  }
                ));

                const eventClone = JSON.parse(JSON.stringify(event));

                if(eventClone.platform?.env) eventClone.platform.env = undefined;

                formData.append(
                  "files[0]",
                  new Blob(
                    [JSON.stringify({error, status, message, eventClone}, undefined, '\t')],
                    {type: 'application/json'}
                  ),
                  "items.json"
                )

                event.platform?.context?.waitUntil(
                  fetch(
                    env.ERROR_REPORTING_WEBHOOK as string,
                    {
                        method: "POST",
                        body: formData
                    }
                  )
                )
            } catch(e) {
                console.error("Error while trying to report another error!", e);
            }
        } else {
            console.warn("Error reporting webhook is falsy!")
        }
    }

    // apparently this is the default behaviour for sveltekit 1.27.6: https://web.archive.org/web/20231114155539/https://kit.svelte.dev/docs/hooks#shared-hooks-handleerror
    if(event.route.id === null) {
        return { message: 'Not Found' };
    } else {
        return { message: 'Internal Error' }
    }
}



function createKVNamespaceWrapper(real: KVNamespace | undefined, kvNamespaceName: string, realPlatform: App.Platform): KVNamespace {
    const analytics: AnalyticsEngineDataset | undefined = realPlatform.env?.KV_ANALYTICS;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    if(!real) { // @ts-ignore
        return real;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return {
        delete(key: string): Promise<void> {
            analytics?.writeDataPoint({blobs: [kvNamespaceName, "DELETE", key, `DELETE ${kvNamespaceName}/${key}`]});
            return real.delete(key);
        },
        list<Metadata>(options: KVNamespaceListOptions | undefined): Promise<KVNamespaceListResult<Metadata, string>> {
            analytics?.writeDataPoint({blobs: [kvNamespaceName, "LIST", null, `LIST ${kvNamespaceName}`]});
            return real.list(options);
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options: KVNamespacePutOptions | undefined): Promise<void> {
            analytics?.writeDataPoint({blobs: [kvNamespaceName, "PUT", key, `PUT ${kvNamespaceName}/${key}`]});
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return real.put(key, value, options);
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        get(key: string, options?: KVNamespaceGetOptions<never>): Promise<string | null> {
            analytics?.writeDataPoint({blobs: [kvNamespaceName, "GET", key, `GET ${kvNamespaceName}/${key}`]});
            return real.get(key, options);
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        getWithMetadata(key: string, options?: KVNamespaceGetOptions<never>): any {
            analytics?.writeDataPoint({blobs: [kvNamespaceName, "GETwMETA", key, `GETwMETA ${kvNamespaceName}/${key}`]});
            return real.getWithMetadata(key, options);
        }

    }
}