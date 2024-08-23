import { error, type ServerLoad } from "@sveltejs/kit";
import { dev } from "$app/environment";

export const load = (async ({platform}) => {

  const db = platform?.env?.FP_SUBS_DB;
  if(!db) throw error(503, "Floatplane subs database not available!");

  if(dev) {
    await db.prepare("create table if not exists totals (timestamp integer PRIMARY KEY, data string)")
      .run();
  }

  const subHistory = await db.prepare("select * from totals")
    .all<{timestamp: number, data: string}>();

  const parsedSubHistory = subHistory.results.map(e => {
    return {
      timestamp: e.timestamp,
      ...JSON.parse(e.data)
    }
  })

  return {
    subHistory: parsedSubHistory
  }

}) satisfies ServerLoad