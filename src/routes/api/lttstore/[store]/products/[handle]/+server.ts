import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { createTables } from "../../../../../(info)/lttstore/createTables.ts";
import { type ProductsTableRow, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";
import type {RequestHandler} from "./$types";


export const GET = (async ({platform, params}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const handle = params.handle;
  const store = storeIdFromName(params.store);

  const product = await retryD1(() =>
    db.prepare("select * from products where store = ? and handle = ?")
      .bind(store, handle)
      .first<ProductsTableRow>()
  );

  if(!product) {
    throw error(404, "Product not found")
  }

  product.product = JSON.parse(product.product);
  product.stock = JSON.parse(product.stock);

  return json(product);
}) satisfies RequestHandler