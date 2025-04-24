import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { dev } from "$app/environment";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";
import { createTables } from "./createTables.ts";
import { retryD1 } from "$lib/utils.ts";


export const load = (async ({platform}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60e3);

  const popularProducts = retryD1(() =>
    db.prepare("select * from products where stockChecked > ? and purchasesPerHour > 10 order by purchasesPerHour DESC limit 11")
      .bind(Math.max(oneWeekAgo, 1745474690241))
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  const lowStock = retryD1(() =>
    db.prepare("select * from products where json_extract(stock, '$.total') > 0 and purchasesPerHour > 0 and json_extract(stock, '$.total')/purchasesPerHour < 24 and stockChecked > ? order by json_extract(stock, '$.total')/purchasesPerHour ASC limit 10")
      .bind(oneWeekAgo)
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  const onSale = retryD1(() =>
    db.prepare("select * from products where currentPrice < regularPrice and json_extract(stock, '$.total') > 0 and handle not like '%bundle%' and title not like '%bundle%' and available=1 order by currentPrice ASC limit 10")
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  const recentRestocks = retryD1(() =>
    db.prepare("select * from products where lastRestock > ? order by lastRestock DESC limit 30")
      .bind(Date.now() - (6 * 24 * 60 * 60e3))
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  let newProducts = await retryD1(() =>
    db.prepare("select * from products where firstSeen > ? order by firstSeen DESC limit 50")
      .bind(Date.now() - (6 * 24 * 60 * 60e3))
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  if(newProducts.length > 12) { // if there are a lot of new products from the past week and also some recently, only show the more recent ones;
    const cutoff = Date.now() - (24 * 60 * 60e3);
    const afterFiltered = newProducts.filter(p => p.firstSeen > cutoff);
    if(afterFiltered.length > 2) {
      newProducts = afterFiltered
    }

  }

  return {
    newProducts,
    popularProducts: await popularProducts,
    lowStock,
    onSale,
    recentRestocks
  }
}) satisfies PageServerLoad

