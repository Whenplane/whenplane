import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";

const stockStartedWorking = 1723950660000;


export const load = (async ({platform, url}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  let sortColumn = Date.now() - stockStartedWorking > 5 * 24 * 60 * 60e3 ? "purchasesPerDay" : "stockChecked";
  if(url.searchParams.has("sort")) {
    switch (url.searchParams.get("sort")) {
      case "purchasesPerHour":
        sortColumn = "purchasesPerHour";
        break;
      case "purchasesPerDay":
        sortColumn = "purchasesPerDay";
        break;
      case "updated":
      case "stockUpdate":
        sortColumn = "stockChecked";
        break;
      case "metaUpdate":
        sortColumn = "metadataUpdate";
        break;
      case "restocked":
        sortColumn = "lastRestock";
        break;
    }
  }

  const allProducts = retryD1(() =>
    db.prepare("select handle,id,available,json_remove(json_remove(json_remove(json_remove(product, '$.media'), '$.images'), '$.variants'), '$.description') as product from products order by " + sortColumn + " DESC")
      .all<ProductsTableRow>()
      .then(r => r.results)
  );

  return {
    allProducts: await allProducts,
    sortColumn,
  }
}) satisfies PageServerLoad
