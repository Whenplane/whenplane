import {Log, LogLevel, Miniflare} from 'miniflare';
import {dev} from '$app/environment';

export const fallBackPlatformToMiniFlareInDev = async (_platform: App.Platform | undefined) => {
    if (!dev) return _platform;

    if (_platform) return _platform;
    const mf = new Miniflare({
        log: new Log(LogLevel.INFO),
        kvPersist: './kv-data',
        kvNamespaces: ['CACHE', 'HISTORY'],
        d1Databases: [],
        globalAsyncIO: true,
        globalTimers: true,
        globalRandom: true,

        script: `
		addEventListener("fetch", (event) => {
			event.waitUntil(Promise.resolve(event.request.url));
			event.respondWith(new Response(event.request.headers.get("X-Message")));
		});
		addEventListener("scheduled", (event) => {
			event.waitUntil(Promise.resolve(event.scheduledTime));
		});
		`,
    });

    const env = await mf.getBindings();
    const context = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        waitUntil: (promise: Promise<never>) => {
            if(!dev) console.error("Attempted to use dev waitUntil in non-dev environment!");
        }
    }
    return {env, context} as App.Platform;
};