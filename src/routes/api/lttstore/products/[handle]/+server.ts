import { error, json, type RequestHandler } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { createTables } from "../../../../(info)/lttstore/createTables.ts";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";


export const GET = (async ({platform, params}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db)

  const handle = params.handle;

  const product = await db.prepare("select * from products where handle = ?")
    .bind(handle)
    .first<ProductsTableRow>();

  if(!product) {
    throw error(404, "Product not found")
  }

  product.product = JSON.parse(product.product);
  product.stock = JSON.parse(product.stock);

  return json(product);
}) satisfies RequestHandler