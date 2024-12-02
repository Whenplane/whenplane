import { error, type ServerLoad } from "@sveltejs/kit";
import type { HistoricalEntry } from "$lib/utils.ts";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { YoutubeAutoSubtitles } from "$lib/timestamps/types.ts";

export const load = (async ({platform, parent}) => {
  const bucket: R2Bucket | undefined = platform?.env?.CAPTIONS;
  if(!bucket) throw error(503, "Missing captions bucket!");

  const showData = await parent() as unknown as HistoricalEntry;

  const videoId = showData.value?.vods?.youtube;

  if(!videoId) {
    throw error(404, "Unable to find the Youtube VOD for this show!")
  }

  const captions = await bucket.get(showData.name.split("/")[0] + "/" + videoId);

  if(captions === null) {
    throw error(404, "No captions found for this show.");
  }

  return {
    transcript: await (captions.json() as Promise<YoutubeAutoSubtitles>)
  };

}) satisfies ServerLoad