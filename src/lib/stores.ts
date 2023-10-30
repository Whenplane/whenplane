import { get, writable } from "svelte/store";
import type { WanDb_FloatplaneData, WanDb_SocketState } from "$lib/utils.ts";
import { browser, dev } from "$app/environment";
import type { LatenessVotingOption } from "$lib/voting.ts";
import { page } from "$app/stores";

export const floatplaneState = writable<WanDb_FloatplaneData>();
export const wdbSocketState = writable<WanDb_SocketState>({lastReceive: browser ? (get(page).data?.isWdbResponseValid ? Date.now() : 0) : 0});

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