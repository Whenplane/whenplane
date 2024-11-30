import { error, type ServerLoad } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";

export const load = (async ({platform, params}) => {

  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const videos = await db.prepare("select * from videos order by releaseDate DESC")
    .bind()
    .all<{videoId: string, status: string, title: string, releaseDate: number, messageCount: number | null}>()
    .then(r => r.results);

  const countingPromises: Promise<[string, number | null]>[] = [];
  for (const video of videos) {
    if(video.messageCount !== null) continue;
    if(video.status === "inprogress") continue;
    console.log("Adding message count for", video)
    countingPromises.push((async () => {

      const count = await db.prepare("select count() as count from merch_messages where video=?")
        .bind(video.videoId)
        .first<{count: number}>()
        .then(r => r?.count);

      if(typeof count === "undefined") {
        console.warn("undefined count", count, "for video", video.videoId);
        return [video.videoId, null];
      }

      await db.prepare("update videos set messageCount=? where videoId=?")
        .bind(count, video.videoId)
        .run();

      return [video.videoId, count];

    })());
  }
  await Promise.all(countingPromises).then(entries => {
    entries.forEach(entry => {
      if(entry[1] == null) return;
      for (let i = 0; i < videos.length; i++) {
        if(videos[i].videoId !== entry[0]) continue;
        videos[i].messageCount = entry[1];
      }
    })
  });

  const videoReleaseDates = Object.fromEntries(videos.map(v => {
    return [
      v.videoId,
      v.releaseDate
    ]
  }))

  return {videos, videoReleaseDates};

}) satisfies ServerLoad;