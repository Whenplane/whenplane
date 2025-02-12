import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";


export const GET = (async ({platform, params}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const products = db.prepare("select * from products")
    .all()
    .then(r => r.results);

  const collections = db.prepare("select * from collections")
    .all()
    .then(r => r.results);

  const collectionChanges = db.prepare("select * from collection_changes where field is not \"updated_at\" or timestamp > ?")
    .bind(Date.now() - (2 * 24 * 60 * 60e3)) // only get update_at entries from the past 2 days
    .all()
    .then(r => r.results);

  const screwdriverStocks = db.prepare("select * from stock_history where id = 6649895092327")
    .all()
    .then(r => r.results);

  // const waterBottleChanges = db.prepare("select * from change_history where id = 7117650296935")
  const changeHistory = db.prepare("select * from change_history where id = 6649895092327 or timestamp > ?")
    .bind(Date.now() - (30 * 24 * 60 * 60e3)) // only get non-screwdriver changes from the past 30 days
    .all()
    .then(r => r.results);

  return json({
    products: await products,
    screwdriverStocks: await screwdriverStocks,
    changeHistory: await changeHistory,
    collections: await collections,
    collectionChanges: await collectionChanges
  })

}) satisfies RequestHandler