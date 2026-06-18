import { error } from "@sveltejs/kit";
import type {PageServerLoad} from "./$types"
import { type ProductsTableRow, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";


export const load = (async ({platform, params}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const store = storeIdFromName(params.store);

  const products = await retryD1(() =>
    db.prepare("select handle,shortTitle,id,available,json_remove(json_remove(json_remove(json_remove(product, '$.media'), '$.images'), '$.variants'), '$.description') as product from products where available = 0 and store = ? order by json_extract(product, '$.created_at') ASC")
      .bind(store)
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  return {products}
}) satisfies PageServerLoad