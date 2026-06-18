import { error } from "@sveltejs/kit";
import type {PageServerLoad} from "./$types"
import { type CollectionDbRow, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";

export const load = (async ({platform, params}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const store = storeIdFromName(params.store);

  const collections = await retryD1(() =>
    db.prepare("select id,title,handle,published_at,updated_at,image,reportedCount,json_array_length(products) as observedCount,available from collections where store = ? order by updated_at desc")
      .bind(store)
      .all<CollectionDbRow & { observedCount: number }>()
      .then(r => r.results)
  );

  return {collections}

}) satisfies PageServerLoad