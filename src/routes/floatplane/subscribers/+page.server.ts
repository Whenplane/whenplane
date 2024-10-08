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

  const olderSubHistory = db.prepare("select * from oldData")
    .all<{timestamp: number, data: string}>();

  const subHistory = db.prepare("select * from totals")
    .all<{timestamp: number, data: string}>();


  const parsedSubHistory = (await subHistory).results.map(e => {
    return {
      timestamp: e.timestamp,
      ...JSON.parse(e.data)
    }
  })
  const parsedOlderSubHistory = (await olderSubHistory).results.map(e => {
    return {
      timestamp: e.timestamp,
      ...JSON.parse(e.data)
    }
  })

  return {
    subHistory: [...parsedOlderSubHistory, ...parsedSubHistory],
  }

}) satisfies ServerLoad