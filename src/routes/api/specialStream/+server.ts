import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import { get } from "svelte/store";
import { floatplaneState } from "$lib/stores.ts";
import type { WanDb_FloatplaneData } from "$lib/wdb_types.ts";

export const GET = (async ({fetch}) => {
  // In the future this will be from a database, but this will be fine for now.

  const data: SpecialStream = {
    title: "Linus Interviews the New CEO (Terren)",
    thumbnail: "https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/168505790704333_1705599393918.jpeg",

    start: "2024-01-18T18:00:00.000Z",

    onFloatplane: true,

    onTwitch: false,
    // twitchNotes: "first half",

    onYoutube: false
  }

  // hide an hour after the start time;
  const hideTime = new Date(data.start as string)
  hideTime.setHours(hideTime.getHours() + 1.5);

  const fpLive: WanDb_FloatplaneData = await fetch("/api/floatplane?fast=true").then(r => r.json());

  const timeUntil = getTimeUntil(hideTime);
  if(timeUntil.late && !(timeUntil.distance < (5 * 60 * 60e3) && fpLive.live)) {
    return json(false);
  } // after

  return json(data);

})