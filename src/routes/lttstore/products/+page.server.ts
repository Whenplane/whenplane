import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";

const stockStartedWorking = 1723950660000;


export const load = (async ({platform, url}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  let sortColumn = Date.now() - stockStartedWorking > 7 * 24 * 60 * 60e3 ? "purchasesPerDay" : "stockChecked";
  if(url.searchParams.has("sort")) {
    switch (url.searchParams.get("sort")) {
      case "purchasesPerHour":
        sortColumn = "purchasesPerHour";
        break;
      case "purchasesPerDay":
        sortColumn = "purchasesPerDay";
        break;
      case "updated":
        sortColumn = "stockChecked";
        break;
      case "restocked":
        sortColumn = "lastRestock";
        break;
    }
  }

  const allProducts = db.prepare("select * from products order by " + sortColumn + " DESC")
    .all<ProductsTableRow>()
    .then(r => r.results);

  return {
    allProducts: await allProducts,
    sortColumn,
  }
}) satisfies PageServerLoad
