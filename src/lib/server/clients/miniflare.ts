import {Log, LogLevel, Miniflare} from 'miniflare';
import {dev} from '$app/environment';

export const fallBackPlatformToMiniFlareInDev = async (_platform: App.Platform | undefined) => {
    if (!dev) return _platform;

    if (_platform) return _platform;
    const mf = new Miniflare({
        log: new Log(LogLevel.INFO),
        kvPersist: './kv-data',
        kvNamespaces: ['CACHE', 'HISTORY', 'META'],
        d1Databases: [],
        globalAsyncIO: true,
        globalTimers: true,
        globalRandom: true,

        modules: true,
        script: `export default { fetch() { return new Response(null, { status: 404 }) } } `,
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