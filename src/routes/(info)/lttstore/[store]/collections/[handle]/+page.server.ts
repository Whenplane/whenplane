import { error } from "@sveltejs/kit";
import { type CollectionDbRow, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import type {PageServerLoad} from "./$types";
import { retryD1 } from "$lib/utils.ts";

export const load = (async ({platform, params}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const store = storeIdFromName(params.store);

  const collection = await retryD1(() =>
    db.prepare("select * from collections where handle = ? and store = ?")
      .bind(params.handle, store)
      .first<CollectionDbRow>()
  )

  if(collection === null) return error(404, "Collection not found");

  const changes = retryD1(() =>
    db.prepare("select * from collection_changes where id = ? and store = ? order by timestamp DESC")
      .bind(collection.id, store)
      .all<{id: number, timestamp: number, field: string, old: string, new: string}>()
      .then(r => r.results)
  );

  return {
    collection,
    changes
  }

}) satisfies PageServerLoad