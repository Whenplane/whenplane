import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../../../../../../.svelte-kit/types/src/routes";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { ProductsTableRow, StockHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";

import { createTables } from "../../createTables.ts";


export const load = (async ({platform, params, url}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db)

  const handle = params.handle;

  // if the "handle" parameter is a number, then it's probably actually an id.
  // Look up its handle and redirect if it is.
  const handleNumber = Number(handle);
  if(!Number.isNaN(handleNumber)) {
    const productHandle = await db.prepare("select handle from products where id = ?")
      .bind(handleNumber)
      .first<{handle: string}>()
      .then(r => r?.handle);
    if(productHandle) throw redirect(301, productHandle)
  }

  const productPromise = db.prepare("select * from products where handle = ?")
    .bind(handle)
    .first<ProductsTableRow>();

  const historyDays = Number(url.searchParams.get("historyDays") ?? 7);

  const stockHistory = db.prepare("select * from stock_history where handle = ? and timestamp > ? order by timestamp")
    .bind(
      handle,
      Date.now() - (historyDays * 24 * 60 * 60e3)
    )
    .all<StockHistoryTableRow>()
    .then(r => r.results);

  const product = await productPromise;

  if(product == null) throw error(404, "Product not found!");

  const changeHistory = db.prepare("select * from change_history where id = ? order by timestamp desc")
    .bind(product.id)
    .all<{id: number, timestamp: number, field: string, old: string, new: string}>()
    .then(r => r.results);

  return {
    product,
    stockHistory: await stockHistory,
    changeHistory
  }
}) satisfies PageServerLoad
