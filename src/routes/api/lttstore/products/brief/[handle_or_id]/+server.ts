import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { createTables } from "../../../../../(info)/lttstore/createTables.ts";
import type {RequestHandler} from "./$types";

export const GET = (async ({platform, params}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
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