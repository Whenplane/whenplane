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

  const popularProducts = db.prepare("select * from products where purchasesPerHour < 188 order by purchasesPerHour DESC limit 11")
    .all<ProductsTableRow>()
    .then(r => r.results);

  const lowStock = db.prepare("select * from products where json_extract(stock, '$.total') > 0 and purchasesPerHour > 0 and json_extract(stock, '$.total')/purchasesPerHour < 24 order by json_extract(stock, '$.total')/purchasesPerHour ASC limit 10")
    .all<ProductsTableRow>()
    .then(r => r.results);

  const onSale = db.prepare("select * from products where currentPrice < regularPrice and json_extract(stock, '$.total') > 0 and handle not like '%bundle%' and title not like '%bundle%' order by currentPrice ASC limit 10")
    .all<ProductsTableRow>()
    .then(r => r.results);

  // hard-coded value is so that items added during the initial database seed are not counted as new. It can be removed in the future
  const newProducts = db.prepare("select * from products where firstSeen > 1718211172431 and firstSeen > ? order by firstSeen DESC limit 10")
    .bind(Date.now() - (6 * 24 * 60 * 60e3))
    .all<ProductsTableRow>()
    .then(r => r.results);

  const recentRestocks = db.prepare("select * from products where lastRestock > ? order by lastRestock DESC limit 30")
    .bind(Date.now() - (6 * 24 * 60 * 60e3))
    .all<ProductsTableRow>()
    .then(r => r.results);

  return {
    allProducts: await allProducts,
    popularProducts: await popularProducts,
    lowStock: await lowStock,
    onSale: await onSale,
    newProducts: await newProducts,
    recentRestocks: await recentRestocks
  }
}) satisfies PageServerLoad

