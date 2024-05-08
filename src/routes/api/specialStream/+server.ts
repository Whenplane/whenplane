import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import type { WanDb_FloatplaneData } from "$lib/wdb_types.ts";

export const GET = (async ({fetch}) => {
  // In the future this will be from a database, but this will be fine for now.

  const data: SpecialStream = {
    title: "I’m Selling This PC for $2… I Hope It Sucks",
    thumbnail: "https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/096166759055993_1715193799485.jpeg",

    start: "2024-05-08T21:10:00Z",

    onFloatplane: true,

    onTwitch: true,
    // twitchNotes: "first half",

    onYoutube: true
  }

  // hide an hour after the start time;
  const hideTime = new Date(data.start as string)
  hideTime.setHours(hideTime.getHours() + 1.5);

  const fpLive: WanDb_FloatplaneData = await fetch("/api/floatplane?fast=true").then(r => r.json());

  const timeUntil = getTimeUntil(hideTime);
  if(timeUntil.late && !(timeUntil.distance < (2 * 60 * 60e3) && fpLive.live)) {
    return json(false);
  } // after

  return json(data);

})