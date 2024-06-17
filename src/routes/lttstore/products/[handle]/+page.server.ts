import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { ProductsTableRow, StockHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";
import { createTables } from "../../+page.server.ts";


export const load = (async ({platform, params}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db)

  const handle = params.handle;

  const productPromise = db.prepare("select * from products where handle = ?")
    .bind(handle)
    .first<ProductsTableRow>();

  const stockHistory = db.prepare("select * from stock_history where handle = ? order by timestamp DESC limit 50")
    .bind(handle)
    .all<StockHistoryTableRow>()
    .then(r => r.results);

  const product = await productPromise;

  if(product == null) throw error(404, "Product not found!");

  return {
    product,
    stockHistory: await stockHistory
  }
}) satisfies PageServerLoad
