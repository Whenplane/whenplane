import type { D1Database } from "@cloudflare/workers-types";
import { error } from "@sveltejs/kit";
import type { CollectionDbRow } from "$lib/lttstore/lttstore_types.ts";

export const load = (async ({platform, params}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const collection = await db.prepare("select * from collections where handle=?")
    .bind(params.handle)
    .first<CollectionDbRow>()

  if(collection === null) return error(404, "Collection not found");

  const changes = db.prepare("select * from collection_changes where id=? order by timestamp DESC")
    .bind(collection.id)
    .all<{id: number, timestamp: number, field: string, old: string, new: string}>()
    .then(r => r.results);

  return {
    collection,
    changes
  }

})