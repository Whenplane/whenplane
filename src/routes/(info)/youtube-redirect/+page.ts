import type { PageLoad } from "../../../../.svelte-kit/types/src/routes";
import type { YoutubeResponse } from "../../api/(live-statuses)/youtube/+server.ts";
import { redirect } from "@sveltejs/kit";
import { browser } from "$app/environment";

export const load = (async ({fetch}) => {
  const fast = (!browser || (location && location.pathname !== "/"));
  const youtubeData = await fetch("/api/youtube?fast=" + fast + "&d=" + Date.now())
    .then(r => r.json() as Promise<YoutubeResponse>);

  if(youtubeData.videoId && !browser) {
    throw redirect(302, "https://youtube.com/watch?v=" + youtubeData.videoId + "&ref=whenplane.com")
  }

  return {
    youtube: youtubeData
  }

}) satisfies PageLoad