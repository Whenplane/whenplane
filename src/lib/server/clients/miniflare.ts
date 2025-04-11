import {Log, LogLevel, Miniflare, Response as MfResponse} from 'miniflare';
import {dev} from '$app/environment';

export const fallBackPlatformToMiniFlareInDev = async (_platform: App.Platform | undefined) => {
    if (!dev) return _platform;

    if (_platform) return _platform;
    const mf = new Miniflare({
        log: new Log(LogLevel.INFO),
        kvPersist: './kv-data',
        d1Persist: true,
        kvNamespaces: ['CACHE', 'HISTORY', 'META', 'WDB_EPISODE_CACHE', "AUTH_KV", "YOUTUBE_TO_DATE"],
        d1Databases: ['DB', "LTTSTORE_DB", "MERCHMESSAGES_DB", "FP_SUBS_DB", "AUTH", "TOPICS"],
        r2Buckets: ['CAPTIONS'],

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
    const caches = await mf.getCaches() as unknown as CacheStorage;
    return {env, context, caches} as App.Platform;
};

export async function realCreateMFResponse(response: Response) {
    if(dev) {
        const text = await response.clone().text();
        return new MfResponse(text, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...Object.fromEntries(response.headers as unknown as Iterable<[string, string]>)
            },
        })
    }
    return response;
}