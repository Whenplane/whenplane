import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";


export const load = (async ({platform, params}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const handle = params.handle;

  const product = db.prepare("select * from products where handle = ?")
    .bind(handle)
    .first();

  const stockHistory = db.prepare("select * from stock_history where handle = ? order by timestamp DESC limit 50")
    .bind(handle)
    .all()
    .then(r => r.results);

  await product;

  if(product == null) throw error(404, "Product not found!");

  return {
    product: await product,
    stockHistory: await stockHistory
  }
}) satisfies PageServerLoad
