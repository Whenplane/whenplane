import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";

export const load = (async ({platform}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const products = await db.prepare("select title,handle,product from products order by json_extract(product, '$.created_at') ASC")
    .all<ProductsTableRow>()
    .then(r => r.results);

  return {products}

}) satisfies PageServerLoad