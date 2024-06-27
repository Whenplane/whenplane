import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import type { WanDb_FloatplaneData } from "$lib/wdb_types.ts";
import type { FpEndpointResponse } from "../(live-statuses)/floatplane/+server.ts";

export const GET = (async ({fetch}) => {
  // In the future this will be from a database, but this will be fine for now.

  const data: SpecialStream = {
    title: "I’ll play ANY game you ask on Snapdragon X",
    thumbnail: "https://pbs.floatplane.com/stream_thumbnails/5c13f3c006f1be15e08e05c0/723373705837702_1719514298161.jpeg",

    start: "2024-06-27T20:00:00Z",
    startIsEstimated: true,

    onFloatplane: true,

    onTwitch: true,
    // twitchNotes: "first half",

    onYoutube: true
  };

  if(!data) {
    return json(data);
  }


  const fpLive: FpEndpointResponse = await fetch("/api/floatplane?fast=true").then(r => r.json());

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