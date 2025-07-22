import { error, json, type RequestHandler } from "@sveltejs/kit";


export const GET = (async ({platform}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(platform?.cf?.asOrganization === "Google Cloud") {
    throw error(403);
  }

  const products = db.prepare("select * from products")
    .all()
    .then(r => r.results);

  const collections = db.prepare("select * from collections")
    .all()
    .then(r => r.results);

  const collectionChanges = db.prepare("select * from collection_changes where timestamp > ? and (field is not \"updated_at\" or timestamp > ?)")
    .bind(Date.now() - (30 * 24 * 60 * 60e3), Date.now() - (6 * 60 * 60e3)) // only get updated_at entries from the past 6h, others only from the past 30d
    .all()
    .then(r => r.results);

  await Promise.all([products, collections, collectionChanges]); // only run 3 at a time
  console.log("first 3 done")

  const screwdriverStocks = db.prepare("select * from stock_history where id = 6649895092327")
    .all()
    .then(r => r.results);

  // const waterBottleChanges = db.prepare("select * from change_history where id = 7117650296935")
  const changeHistory = db.prepare("select * from change_history where id = 6649895092327 or timestamp > ?")
    .bind(Date.now() - (14 * 24 * 60 * 60e3)) // only get non-screwdriver changes from the past 14 days
    .all()
    .then(r => r.results);

  const similarProducts = db.prepare("select * from similar_products")
    .all()
    .then(r => r.results)

  return json({
    products: await products,
    screwdriverStocks: await screwdriverStocks,
    changeHistory: await changeHistory,
    collections: await collections,
    collectionChanges: await collectionChanges,
    similarProducts: await similarProducts
  })

}) satisfies RequestHandler