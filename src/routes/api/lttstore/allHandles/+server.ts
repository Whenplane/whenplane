import type { D1Database } from "@cloudflare/workers-types";
import { error, json } from "@sveltejs/kit";

export const GET = (async ({platform}) => {

  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const allProducts = await db.prepare("select handle,purchasesPerDay,available from products order by MAX(purchasesPerDay, 0) DESC, available DESC")
    .all<{handle: string}>()
    .then(r =>
      r.results
        .map(p => p.handle)
    );

  return json(allProducts)
})