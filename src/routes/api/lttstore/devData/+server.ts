import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";


export const GET = (async ({platform, params}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const products = db.prepare("select * from products")
    .all()
    .then(r => r.results);

  const screwdriverStocks = db.prepare("select * from stock_history where id = 6649895092327")
    .all()
    .then(r => r.results);

  return json({
    products: await products,
    screwdriverStocks: await screwdriverStocks,
  })

}) satisfies RequestHandler