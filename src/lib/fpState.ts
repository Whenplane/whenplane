import { writable } from "svelte/store";
import type { WanDb_FloatplaneData } from "$lib/utils.ts";
import { dev } from "$app/environment";

export const floatplaneState = writable<WanDb_FloatplaneData>();

if(dev) {
  floatplaneState.subscribe(value => console.debug("Floatplane status changed:", value))
}