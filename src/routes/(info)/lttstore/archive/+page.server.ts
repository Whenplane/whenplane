import { error, type ServerLoad } from "@sveltejs/kit";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";
import type { D1Database } from "@cloudflare/workers-types";


export const load = (async ({platform}) => {

  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const products = await db.prepare("select handle,id,available,json_remove(json_remove(json_remove(json_remove(product, '$.media'), '$.images'), '$.variants'), '$.description') as product from products where available=0 order by json_extract(product, '$.created_at') ASC")
    .all<ProductsTableRow>()
    .then(r => r.results);

  return {products}
}) satisfies ServerLoad