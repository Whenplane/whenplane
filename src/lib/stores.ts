import { get, writable } from "svelte/store";
import { browser, dev } from "$app/environment";
import type { LatenessVotingOption } from "$lib/voting.ts";
import { page } from "$app/stores";
import type { WanDb_FloatplaneData, WanDb_SocketState } from "$lib/wdb_types.ts";

export const floatplaneState = writable<WanDb_FloatplaneData>();
export const wdbSocketState = writable<WanDb_SocketState>({lastReceive: browser ? (get(page).data?.isWdbResponseValid ? Date.now() : 0) : 0});

export let serviceWorker: ServiceWorkerRegistration | undefined = undefined;
export function setServiceWorker(worker: ServiceWorkerRegistration) {
  serviceWorker = worker;
  console.debug("Registered service worker", serviceWorker)
}

if(dev) {
  floatplaneState.subscribe(value => console.debug("Floatplane status changed:", value))
}

export const latenessVotesCache: LatenessVotingCache = {
  lastFetch: 0
}

export type LatenessVotingCache = {
  lastFetch: number,
  lastData?: LatenessVotingOption[]
};

export const nextFast = {nextFast: false};