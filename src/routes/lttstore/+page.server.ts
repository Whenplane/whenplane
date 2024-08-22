import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";
import { createTables } from "./createTables.ts";


export const load = (async ({platform}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db)

  const allProducts = db.prepare("select id,handle,title,json_extract(product, '$.featured_image') as featured_image, available from products")
    .all<ProductsTableRow>()
    .then(r => r.results);

  const popularProducts = db.prepare("select * from products order by purchasesPerHour DESC limit 11")
    .all<ProductsTableRow>()
    .then(r => r.results);

  const lowStock = db.prepare("select * from products where json_extract(stock, '$.total') > 0 and purchasesPerHour > 0 and json_extract(stock, '$.total')/purchasesPerHour < 24 order by json_extract(stock, '$.total')/purchasesPerHour ASC limit 10")
    .all<ProductsTableRow>()
    .then(r => r.results);

  const onSale = db.prepare("select * from products where currentPrice < regularPrice and json_extract(stock, '$.total') > 0 and handle not like '%bundle%' and title not like '%bundle%' and available=1 order by currentPrice ASC limit 10")
    .all<ProductsTableRow>()
    .then(r => r.results);

  const recentRestocks = db.prepare("select * from products where lastRestock > ? order by lastRestock DESC limit 30")
    .bind(Date.now() - (6 * 24 * 60 * 60e3))
    .all<ProductsTableRow>()
    .then(r => r.results);

  let newProducts = await db.prepare("select * from products where firstSeen > ? order by firstSeen DESC limit 50")
    .bind(Math.max(1724356079932, Date.now() - (6 * 24 * 60 * 60e3))) // this hard-coded value is to remove the "new" products that were released during the breakage in august
    .all<ProductsTableRow>()
    .then(r => r.results);

  if(newProducts.length > 12) { // if there are a lot of new products from the past week and also some recently, only show the more recent ones;
    const cutoff = Date.now() - (24 * 60 * 60e3);
    const afterFiltered = newProducts.filter(p => p.firstSeen > cutoff);
    if(afterFiltered.length > 2) {
      newProducts = afterFiltered
    }

  }

  return {
    allProducts: await allProducts,
    popularProducts: await popularProducts,
    lowStock: await lowStock,
    onSale: await onSale,
    newProducts: await newProducts,
    recentRestocks: await recentRestocks
  }
}) satisfies PageServerLoad

