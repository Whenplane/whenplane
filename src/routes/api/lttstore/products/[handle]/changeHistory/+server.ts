import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { createTables } from "../../../../../(info)/lttstore/createTables.ts";
import type {RequestHandler} from "./$types";


export const GET = (async ({fetch, params, platform}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const brief: {id: number, handle: string, title: string} | undefined = await fetch(`/api/lttstore/products/brief/${params.handle}`)
    .then(r => r.ok ? r.json() : undefined);

  if(!brief) throw error(404, 'Product not found (this could also be an internal error)');

  const changeHistory = await db.prepare("select * from change_history where id = ? order by timestamp desc")
    .bind(brief.id)
    .all<{id: number, timestamp: number, field: string, old: string, new: string}>()
    .then(r => r.results);

  return json(changeHistory);
}) satisfies RequestHandler