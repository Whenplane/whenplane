import { error } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils.ts";
import type { MMShow } from "$lib/merch-messages/mm-types.ts";
import type { PageServerLoad } from "./$types";

export const load = (async ({platform}) => {

  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const shows = await retryD1(() =>
    db.prepare("select * from shows order by releaseDate DESC")
      .bind()
      .all<MMShow>()
      .then(r => r.results)
  );

  const countingPromises: Promise<[string, number, number]>[] = [];
  for (const show of shows) {
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

      await retryD1(() =>
        db.prepare("update shows set messageCount=? and replyCount=? where showId=?")
          .bind(messageCount, replyCount, show.showId)
          .run()
      );

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

  return {shows, videoReleaseDates};

}) satisfies PageServerLoad;