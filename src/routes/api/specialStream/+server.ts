import type { SpecialStream } from "$lib/utils.ts";
import { json } from "@sveltejs/kit";
import { getTimeUntil } from "$lib/timeUtils.ts";
import type { FpEndpointResponse } from "../(live-statuses)/floatplane/+server.ts";

export const GET = (async ({fetch}) => {
  // In the future this will be from a database, but this will be fine for now.

  const data: SpecialStream | false = {
    title: "Streams with Sarah - Shirt Design Stream 2",
    thumbnail: "https://pbs.floatplane.com/blogPost_thumbnails/4xXdEpaceQ/351967502414299_1734130110413_400x225.jpeg",

    start: "2024-12-19T18:00:00Z",
    startIsEstimated: false,

    onFloatplane: true,

    onTwitch: false,
    // twitchNotes: "first half",

    onYoutube: false
  } //false;

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