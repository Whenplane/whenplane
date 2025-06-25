import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import type { FpEndpointResponse } from "../(live-statuses)/floatplane/+server.ts";

export const GET = (async ({fetch}) => {
  // In the future this will be from a database, but this will be fine for now. (update a year later: heh)


  const data: SpecialStream | false = /*Date.now() > 1742608091103 ?*/ {
    title: "Building 5 PCs in the 5 BEST selling Cases",
    thumbnail: "https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/299559822037673_1750877104569.jpeg",

    start: "2025-06-25T19:30:00Z",
    startIsEstimated: true,

    onFloatplane: true,

    onTwitch: true,
    // twitchNotes: "first half",

    onYoutube: true
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