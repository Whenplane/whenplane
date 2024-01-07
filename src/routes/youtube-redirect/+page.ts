import type { PageLoad } from "./$types";
import type { YoutubeResponse } from "../api/(live-statuses)/youtube/+server.ts";
import { redirect } from "@sveltejs/kit";
import { browser } from "$app/environment";

export const load = (async ({fetch}) => {
  const youtubeData = await fetch("/api/youtube")
    .then(r => r.json() as Promise<YoutubeResponse>);

  if(youtubeData.videoId && !browser) {
    throw redirect(302, "https://youtube.com/watch?v=" + youtubeData.videoId + "&ref=whenplane.com")
  }

  return {
    youtube: youtubeData
  }

}) satisfies PageLoad