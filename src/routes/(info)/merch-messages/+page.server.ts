import { error } from "@sveltejs/kit";
import { type HistoricalEntry, retryD1, type YoutubeThumbnails } from "$lib/utils.ts";
import type { MMShow } from "$lib/merch-messages/mm-types.ts";
import type { PageServerLoad } from "./$types";
import type { AlternateTimeRow } from "../../api/alternateStartTimes/+server.ts";
import { version } from "$app/environment";

export const load = (async ({platform, fetch}) => {

  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const alternateStartTimesP = fetch("/api/alternateStartTimes?v="+version)
    .then(r => r.json() as Promise<AlternateTimeRow[]>)

  const shows = await retryD1(() =>
    db.prepare("select * from shows order by releaseDate DESC")
      .bind()
      .all<MMShow>()
      .then(r => r.results)
  );

  const thumbnailPromises: Promise<[string, YoutubeThumbnails]>[] = [];
  const countingPromises: Promise<[string, number, number]>[] = [];
  for (const show of shows) {
    thumbnailPromises.push(
      fetch("/api/history/show/" + show.showId)
        .then(r => r.json())
        .then(showMeta => [show.showId, showMeta?.value?.thumbnails ?? showMeta?.value?.snippet?.thumbnails])
    )
    if(show.messageCount !== null && show.replyCount !== null) continue;
    if(show.status !== "complete") continue;
    console.log("Adding message count for", show)
    countingPromises.push((async () => {

      const allMessages = await retryD1(() =>
        db.prepare("select id,type from merch_messages_v2 where show=?")
          .bind(show.showId)
          .all<{id: string, type: "message" | "reply"}>()
          .then(r => r.results)
      );

      const messageCount = allMessages.filter(m => m.type === "message").length;
      const replyCount = allMessages.filter(m => m.type === "reply").length;

      platform?.context?.waitUntil(
        retryD1(() =>
          db.prepare("update shows set messageCount=?, replyCount=? where showId=?")
            .bind(messageCount, replyCount, show.showId)
            .run()
        )
      )

      return [show.showId, messageCount, replyCount];

    })());
  }
  await Promise.all(countingPromises).then(entries => {
    entries.forEach(entry => {
      if(entry[1] == null) return;
      for (let i = 0; i < shows.length; i++) {
        if(shows[i].showId !== entry[0]) continue;
        shows[i].messageCount = entry[1];
        shows[i].replyCount = entry[2];
      }
    })
  });

  const videoReleaseDates = Object.fromEntries(shows.map(v => {
    return [
      v.showId,
      v.releaseDate
    ]
  }))

  return {
    shows,
    videoReleaseDates,
    showThumbnails: await Promise.all(thumbnailPromises)
      .then(r => Object.fromEntries(r)),
    alternateStartTimes: await alternateStartTimesP
  };

}) satisfies PageServerLoad;