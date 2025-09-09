import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import type { FpEndpointResponse } from "../(live-statuses)/floatplane/+server.ts";

export const GET = (async ({fetch}) => {
  // In the future this will be from a database, but this will be fine for now. (update a year later: heh)


  const data: SpecialStream | false = /*Date.now() > 1742608091103 ?*/ {
    title: "Scrapyard Wars Director Commentary (with participants)",
    thumbnail: "https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/597734054596050_1757436155287.jpeg",

    start: "2025-09-09T19:00:00Z",
    startIsEstimated: true,

    onFloatplane: true,

    onTwitch: false,
    // twitchNotes: "first half",

    onYoutube: false
  } //: false as SpecialStream | false;

  if(!data) {
    return json(data);
  }


  if(data.start) {
    // hide an hour after the start time;
    const hideTime = new Date(data.start as string)
    hideTime.setHours(hideTime.getHours() + 1.5);

    const fpLive: FpEndpointResponse = await fetch("/api/floatplane?fast=true").then(r => r.json());

    const timeUntil = getTimeUntil(hideTime);
    if(timeUntil.late && !(timeUntil.distance < (2 * 60 * 60e3) && fpLive.isLive)) {
      return json(false);
    }
  }

  return json(data);

})
