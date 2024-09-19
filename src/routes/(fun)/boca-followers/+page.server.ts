import { error, type ServerLoad } from "@sveltejs/kit";
import { dev } from "$app/environment";

export const load = (async ({platform}) => {

  const db = platform?.env?.FP_SUBS_DB;
  if(!db) throw error(503, "Floatplane subs database not available!");

  if(dev) {
    await db.prepare("create table if not exists totals (timestamp integer PRIMARY KEY, data string)")
      .run();
    await db.prepare("insert or ignore into totals (timestamp, data) values (?, ?)")
      .bind(1724385030688, "{\"totalSubscriberCount\": 36343, \"totalIncome\": null}")
      .run();
  }

  const followHistory = db.prepare("select * from boca_follower_history")
    .all<{timestamp: number, followers: number}>();


  return {
    followHistory
  }

}) satisfies ServerLoad