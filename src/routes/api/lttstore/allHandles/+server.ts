import { error, json } from "@sveltejs/kit";
import type {RequestHandler} from "./$types";

export const GET = (async ({platform}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const allProducts = await db.prepare("select handle,purchasesPerDay,available from products order by MAX(purchasesPerDay, 0) DESC, available DESC")
    .all<{handle: string}>()
    .then(r =>
      r.results
        .map(p => p.handle)
    );

  return json(allProducts)
}) satisfies RequestHandler