import { writable } from "svelte/store";
import type { WanDb_FloatplaneData } from "$lib/utils.ts";
import { dev } from "$app/environment";
import type { LatenessVotingOption } from "$lib/voting.ts";

export const floatplaneState = writable<WanDb_FloatplaneData>();

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