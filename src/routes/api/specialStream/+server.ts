import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";

export const GET = (async () => {
  // In the future this will be from a database, but this will be fine for now.

  const data: SpecialStream = {
    title: "Gingerbread PC Building (with Sarah)",
    thumbnail: "https://images.ajg0702.us/gingerbread_sarah.jpeg",

    start: "2023-12-21T20:30:00.000Z",

    onFloatplane: true,

    onTwitch: true,
    twitchNotes: "first half",

    onYoutube: false
  }

  const timeUntil = getTimeUntil(new Date(data.start as string));
  if(timeUntil.late) {
    return json(false);
  } // after

  return json(data);

})