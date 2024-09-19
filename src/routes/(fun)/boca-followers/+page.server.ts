import { error, type ServerLoad } from "@sveltejs/kit";
import { dev } from "$app/environment";

export const load = (async ({platform}) => {

  const db = platform?.env?.FP_SUBS_DB;
  if(!db) throw error(503, "Floatplane subs database not available!");

  if(dev) {
    await db.prepare("create table if not exists boca_follower_history (timestamp integer PRIMARY KEY, followers number)")
      .run();
    await db.prepare("insert or ignore into boca_follower_history (timestamp, followers) values (?, ?)")
      .bind(1726545600000, 7612)
      .run();
    await db.prepare("insert or ignore into boca_follower_history (timestamp, followers) values (?, ?)")
      .bind(1726779642461, 8115)
      .run();
  }

  const followHistory = await db.prepare("select * from boca_follower_history")
    .all<{timestamp: number, followers: number}>().then(r => r.results);


  return {
    followHistory
  }

}) satisfies ServerLoad