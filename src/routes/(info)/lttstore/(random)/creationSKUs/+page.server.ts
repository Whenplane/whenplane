import type { D1Database } from "@cloudflare/workers-types";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";

export const load = (async ({platform}) => {

  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const products = await db.prepare("select title,handle,product from products order by json_extract(product, '$.created_at') ASC")
    .all<ProductsTableRow>()
    .then(r => r.results);

  return {products}

}) satisfies PageServerLoad