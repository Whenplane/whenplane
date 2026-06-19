import { retryD1 } from "$lib/utils.ts";
import { type ProductsTableRow, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import { error, json } from "@sveltejs/kit";
import type {RequestHandler} from "./$types";

export const GET = (async ({platform, url, params}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");
  const withMedia = url.searchParams.has("withMedia");

  const store = storeIdFromName(params.store);

  const allProducts = await retryD1(() =>
    db.prepare(
      "select handle,shortTitle,id,available," +
      (withMedia ?
         "json_remove(json_remove(json_remove(product, '$.variants'), '$.images'), '$.description')" :
         "json_remove(json_remove(json_remove(json_remove(product, '$.variants'), '$.images'), '$.description'), '$.media')"
      ) +
      " as product from products where store = ?"
    )
      .bind(store)
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  return json(allProducts);
}) satisfies RequestHandler;