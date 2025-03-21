import { error, type ServerLoad } from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils.ts";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { YoutubeAutoSubtitles } from "$lib/timestamps/types.ts";
import { dev } from "$app/environment";

export const load = (async ({platform, parent}) => {
  const bucket: R2Bucket | undefined = platform?.env?.CAPTIONS;
  if(!bucket) throw error(503, "Missing captions bucket!");

  const showData = await parent() as unknown as HistoricalEntry;

  const videoId = showData.value?.vods?.youtube;

  if(!videoId) {
    throw error(404, "Unable to find the Youtube VOD for this show!")
  }

  const objectKey = showData.name.split("/")[0] + "/" + videoId;
  let captions = await bucket.get(objectKey)
    .catch(e => {
      console.warn("Got " + (e.message ? "'" + e.message + "'" : "error") + " on 1st attempt, retrying due to:", e)
      return bucket.get(objectKey);
    });

  if(dev && captions === null) {
    const fetchedCaptionsResponse = await fetch("https://captions.whenplane.com/" + objectKey);
    if(fetchedCaptionsResponse.ok) {
      await bucket.put(objectKey, await fetchedCaptionsResponse.text(), {httpMetadata: {contentType: fetchedCaptionsResponse.headers.get("content-type") ?? "text/plain"}})
      captions = await bucket.get(objectKey);
    } else {
      console.warn("Fetching from prod failed!", fetchedCaptionsResponse.status, fetchedCaptionsResponse.statusText)
    }
  }

  if(captions === null) {
    throw error(404, "No captions found for this show.");
  }

  return {
    transcript: await (captions.json() as Promise<YoutubeAutoSubtitles>),
    videoId
  };

}) satisfies ServerLoad