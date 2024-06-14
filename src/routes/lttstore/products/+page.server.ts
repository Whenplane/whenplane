import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";


export const load = (async ({platform}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const allProducts = db.prepare("select * from products order by purchasesPerHour DESC")
    .all<ProductsTableRow>()
    .then(r => r.results);

  return {
    allProducts: await allProducts,
  }
}) satisfies PageServerLoad
