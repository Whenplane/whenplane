import { error } from "@sveltejs/kit";
import type {PageServerLoad} from "./$types"
import type { CollectionDbRow } from "$lib/lttstore/lttstore_types.ts";

export const load = (async ({platform}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const collections = await db.prepare("select id,title,handle,published_at,updated_at,image,reportedCount,json_array_length(products) as observedCount,available from collections order by updated_at desc")
    .all<CollectionDbRow & { observedCount: number }>()
    .then(r => r.results);

  return {collections}

}) satisfies PageServerLoad