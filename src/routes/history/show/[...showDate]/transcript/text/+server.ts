import { error, type RequestHandler, text } from "@sveltejs/kit";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { HistoricalEntry } from "$lib/utils.ts";
import { dev } from "$app/environment";
import type { YoutubeAutoSubtitles } from "$lib/timestamps/types";

export const GET = (async ({platform, params, fetch}) => {
  const bucket: R2Bucket | undefined = platform?.env?.CAPTIONS;
  if(!bucket) throw error(503, "Missing captions bucket!");

  const showResponsePromise = fetch(
    "/api/history/show/" + params.showDate,
    {
      headers: {
        "Accept": "application/json"
      }
    }
  );

  const showResponse = await showResponsePromise;

  const showData = await showResponse.json() as HistoricalEntry & {message?: string};

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

  const {events} = await captions.json<YoutubeAutoSubtitles>()
  let allText = "";
  for (const event of events) {
    if(!event.segs) continue;
    for (const seg of event.segs) {
      if(!seg.utf8) continue;
      allText += seg.utf8;
    }
  }

  return text(allText);
}) satisfies RequestHandler