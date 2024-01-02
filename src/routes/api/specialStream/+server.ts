import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import { get } from "svelte/store";
import { floatplaneState } from "$lib/stores.ts";

export const GET = (async () => {
  // In the future this will be from a database, but this will be fine for now.

  const data: SpecialStream = {
    title: "Gingerbread PC Building (with Sarah & guests)",
    thumbnail: "https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/276172365615767_1703191094285.jpeg",

    start: "2023-12-21T20:30:00.000Z",

    onFloatplane: true,

    onTwitch: false,
    twitchNotes: "first half",

    onYoutube: false
  }

  // hide an hour after the start time;
  const hideTime = new Date(data.start as string)
  hideTime.setHours(hideTime.getHours() + 2);

  const timeUntil = getTimeUntil(hideTime);
  if(timeUntil.late) {
    return json(false);
  } // after

  return json(data);

})