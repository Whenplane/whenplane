// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
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
            FETCHER: DurableObjectNamespace;

            NOTIFICATION_THROTTLER: DurableObjectNamespace;
            NOTIFICATION_QUEUE: Queue<NotificationMessage>

            TWITCH_ANALYTICS?: AnalyticsEngineDataset;
            LOG_MESSAGES?: AnalyticsEngineDataset;
            REQUESTS?: AnalyticsEngineDataset;
            KV_ANALYTICS?: AnalyticsEngineDataset;
            DB: D1Database;
        },
        context?: {
            /**
             * Waits for the promise to complete without blocking.
             * @param promise The promise that is ensured completion
             */
            waitUntil: (promise: Promise) => void
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
