import { error, json, type RequestHandler } from "@sveltejs/kit";


export const GET = (async ({platform}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(platform?.cf?.asOrganization === "Google Cloud") {
    throw error(403);
  }

  const products = db.prepare("select * from products")
    .all()
    .then(r => r.results)
    .finally(() => console.log("products query finished"))

  const collections = db.prepare("select * from collections")
    .all()
    .then(r => r.results)
    .finally(() => console.log("collections query finished"))

  const screwdriverStocks = db.prepare("select * from stock_history where id = 6649895092327 and timestamp > ?")
    .bind(Date.now() - (6 * 30 * 24 * 60 * 60e3))
    .all()
    .then(r => r.results)
    .finally(() => console.log("screwdriverStocks query finished"))

  const similarProducts = db.prepare("select * from similar_products")
    .all()
    .then(r => r.results)
    .finally(() => console.log("similarProducts query finished"))

  return json({
    products: await products,
    screwdriverStocks: await screwdriverStocks,
    collections: await collections,
    similarProducts: await similarProducts
  })

}) satisfies RequestHandler