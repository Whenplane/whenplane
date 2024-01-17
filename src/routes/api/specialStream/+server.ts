import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import { get } from "svelte/store";
import { floatplaneState } from "$lib/stores.ts";

export const GET = (async () => {
  // In the future this will be from a database, but this will be fine for now.

  const data: SpecialStream = {
    title: "Linus Interviews the New CEO (Terren)",
    thumbnail: "https://images.ajg0702.us/terren.webp",

    start: "2024-01-18T18:00:00.000Z",

    onFloatplane: true,

    onTwitch: false,
    // twitchNotes: "first half",

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