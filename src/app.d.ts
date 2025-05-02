// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
import {
    __DURABLE_OBJECT_BRAND, type D1Database,
    type DurableObjectNamespace,
    type IncomingRequestCfProperties,
    type KVNamespace
} from "@cloudflare/workers-types";


declare global {
    namespace App {
        interface Locals {
            addTiming: (timing: TimingEntry) => void,
            id: string
        }
        // interface PageData {}
        // interface Error {}
        interface Platform {
            env?: {
                CACHE: KVNamespace;
                HISTORY: KVNamespace;
                META: KVNamespace;
                WDB_EPISODE_CACHE: KVNamespace;
                AUTH_KV: KVNamespace;
                YOUTUBE_TO_DATE: KVNamespace;
                LTTSTORE_CHANGE_IMAGES: KVNamespace;

                FETCHER: DurableObjectNamespace;
                FLOATPLANE_FETCHER: DurableObjectNamespace;
                WS_OBJECT: DurableObjectNamespace<SocketObject>;
                LTTSTORE_UPD_REQ_OBJ: DurableObjectNamespace;
                LTTSTORE_CHANGE_SCREENSHOT: DurableObjectNamespace;

                NOTIFICATION_THROTTLER: DurableObjectNamespace;
                NOTIFICATION_QUEUE: Queue<NotificationMessage>

                TWITCH_ANALYTICS?: AnalyticsEngineDataset;
                LOG_MESSAGES?: AnalyticsEngineDataset;
                REQUESTS?: AnalyticsEngineDataset;
                KV_ANALYTICS?: AnalyticsEngineDataset;
                TEST_WS_ANALYTICS?: AnalyticsEngineDataset;

                DB: D1Database;
                BOCA_DB: D1Database;
                LTTSTORE_DB: D1Database;
                MERCHMESSAGES_DB: D1Database;
                FP_SUBS_DB: D1Database;
                AUTH: D1Database;
                TOPICS: D1Database;

                CAPTIONS: R2Bucket;
            },
            context?: {
                /**
                 * Waits for the promise to complete without blocking.
                 * @param promise The promise that is ensured completion
                 */
                waitUntil: (promise: Promise) => void
            },
            cf?: IncomingRequestCfProperties,
            caches: CacheStorage
        }
    }
}

type KVListResponse<Metadata = unknown> = KVNamespaceListResult<Metadata, string>

type BestShow = {
    name: string,
    distance: number
} | undefined;
type BestShowTime = {
    name: string,
    distance: number,
    time: number
} | undefined;


type TimingEntry = {
    id: string,
    duration: number,
    description?: string
}

type NotificationMessage = {
    id: number,
    type: string,
    subscription: PushSubscription,
    message: PushMessage,
    isDummy?: boolean
}

interface SocketObject extends DurableObject {
    sendData(event: string, data: object): Promise<void>;
}
