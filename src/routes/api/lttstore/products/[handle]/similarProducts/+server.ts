import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { createTables } from "../../../../../(info)/lttstore/createTables.ts";
import type {RequestHandler} from "./$types";


export const GET = (async ({params, platform}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const changeHistory = await db.prepare("select * from similar_products where handle = ?")
    .bind(params.handle)
    .first<{similar: string}>()
    .then(r => r?.similar)
    .then(r => r ? JSON.parse(r) : r)

  if(!changeHistory) throw error(404, 'Product not found (or has no similar products yet)');

  return json(changeHistory);
}) satisfies RequestHandler