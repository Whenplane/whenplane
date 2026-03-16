import { retryD1 } from "$lib/utils.ts";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET = (async ({platform, url}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");
  const withMedia = url.searchParams.has("withMedia");

  const allProducts = await retryD1(() =>
    db.prepare(
      "select handle,id,available," +
      (withMedia ?
         "json_remove(json_remove(json_remove(product, '$.variants'), '$.images'), '$.description')" :
         "json_remove(json_remove(json_remove(json_remove(product, '$.variants'), '$.images'), '$.description'), '$.media')"
      ) +
      " as product from products"
    )
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  return json(allProducts);
}) satisfies RequestHandler;