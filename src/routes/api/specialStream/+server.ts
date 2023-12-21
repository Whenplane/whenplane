import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";

export const GET = (async () => {
  // In the future this will be from a database, but this will be fine for now.

  const data: SpecialStream = {
    title: "Gingerbread PC Building (with Sarah & guests)",
    thumbnail: "https://images.ajg0702.us/gingerbread_sarah.jpeg",

    start: "2023-12-21T20:30:00.000Z",

    onFloatplane: true,

    onTwitch: true,
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