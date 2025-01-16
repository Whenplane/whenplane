import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import type { FpEndpointResponse } from "../(live-statuses)/floatplane/+server.ts";

export const GET = (async ({fetch}) => {
  // In the future this will be from a database, but this will be fine for now. (update a year later: heh)

  const fpLive: FpEndpointResponse = await fetch("/api/floatplane?fast=true").then(r => r.json());

  const data: SpecialStream | false = {
    title: "Arc Battlemage Game Compatability Challenge",
    thumbnail: "https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/314301655780212_1737048742498.jpeg",

    start: "2025-01-16T21:00:00Z",
    startIsEstimated: true,

    onFloatplane: true,

    onTwitch: true,
    // twitchNotes: "first half",

    onYoutube: true
  } //false;

  if(!data) {
    return json(data);
  }


  if(data.start) {
    // hide an hour after the start time;
    const hideTime = new Date(data.start as string)
    hideTime.setHours(hideTime.getHours() + 1.5);

    const timeUntil = getTimeUntil(hideTime);
    if(timeUntil.late && !(timeUntil.distance < (2 * 60 * 60e3) && fpLive.isLive)) {
      return json(false);
    }
  }

  return json(data);

})