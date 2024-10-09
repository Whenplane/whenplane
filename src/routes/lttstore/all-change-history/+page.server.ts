import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import { createTables } from "../createTables.ts";



export const load = (async ({platform}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const changeHistory = db.prepare("select * from change_history order by timestamp desc")
    .all<{id: number, timestamp: number, field: string, old: string, new: string}>()
    .then(r => r.results);

  return {
    changeHistory: await changeHistory
  }
}) satisfies PageServerLoad;
