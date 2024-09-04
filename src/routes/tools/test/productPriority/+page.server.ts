import type { PageServerLoad } from "./$types";
import type { ProductsTableRow } from "$lib/lttstore/lttstore_types.ts";

let products: ProductsTableRow[];
let fetched: string;

export const load = (async ({fetch}) => {

  if(products) {
    return {
      products,
      fetched
    }
  }

  products = await fetch("https://whenplane.com/api/lttstore/devData")
    .then(r => r.json())
    .then(r => r.products);
  fetched = new Date().toLocaleString(undefined, {timeZone: "America/Phoenix"});

  return {
    products,
    fetched
  }


}) satisfies PageServerLoad