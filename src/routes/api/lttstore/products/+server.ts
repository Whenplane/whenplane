import { retryD1 } from "$lib/utils.ts";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET = (async ({platform}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const allProducts = await retryD1(() =>
    db.prepare("select handle,id,available,json_remove(json_remove(json_remove(json_remove(product, '$.media'), '$.images'), '$.variants'), '$.description') as product from products")
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  return json(allProducts);
}) satisfies RequestHandler;