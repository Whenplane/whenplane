import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils.ts";
import { type CollectionDbRow, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";


export const GET = (async ({platform, params}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const store = storeIdFromName(params.store);

  const collection = await retryD1(() =>
    db.prepare("select * from collections where store = ? and handle = ?")
      .bind(store, params.handle)
      .first<CollectionDbRow>()
  )

  return json(collection);
}) satisfies RequestHandler