import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { dev } from "$app/environment";
import { createTables } from "../createTables.ts";
import { retryD1 } from "$lib/utils.ts";



export const load = (async ({platform}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const changeHistory = retryD1(() =>
    db.prepare("select * from change_history order by timestamp desc limit 200")
      .all<{id: number, timestamp: number, field: string, old: string, new: string}>()
      .then(r => r.results)
  );

  return {
    changeHistory: await changeHistory
  }
}) satisfies PageServerLoad;
