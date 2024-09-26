import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import { createTables } from "../../../../../lttstore/createTables.ts";

export const GET = (async ({platform, params}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const handle = params.handle_or_id;

  // if the "handle" parameter is a number, then it's probably actually an id.
  // Look up its handle and redirect if it is.
  const handleNumber = Number(handle);
  if(!Number.isNaN(handleNumber)) {
    const productFromId = await db.prepare("select id,handle,title from products where id = ?")
      .bind(handleNumber)
      .first<{id: number, handle: string, title: string}>();
    if(productFromId) {
      return json(productFromId);
    }
  }

  const productFromHandle = await db.prepare("select id,handle,title from products where handle = ?")
    .bind(handle)
    .first<{id: number, handle: string, title: string}>();
  if(productFromHandle) {
    return json(productFromHandle);
  }

  throw error(404, "Product not found");

}) satisfies RequestHandler