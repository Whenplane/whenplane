import { error, json } from "@sveltejs/kit";
import type {RequestHandler} from "./$types";
import { storeIdFromName } from "$lib/lttstore/lttstore_types.ts";

export const GET = (async ({platform, params}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const store = storeIdFromName(params.store);

  const allProducts = await db
    .prepare("select handle,purchasesPerDay,available from products where store = ? order by MAX(purchasesPerDay, 0) DESC, available DESC")
    .bind(store)
    .all<{handle: string}>()
    .then(r =>
      r.results
        .map(p => p.handle)
    );

  return json(allProducts)
}) satisfies RequestHandler