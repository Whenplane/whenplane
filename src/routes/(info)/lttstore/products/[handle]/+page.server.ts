import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { ProductsTableRow, StockHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";

import { createTables } from "../../createTables.ts";

const DAY = 24 * 60 * 60e3;


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

  const product = await db.prepare("select * from products where handle = ?")
    .bind(handle)
    .first<ProductsTableRow>();

  if(product == null) throw error(404, "Product not found!");


  const stockCheckDistance = Date.now() - product.stockChecked;
  let defaultHistoryDays: number | string = 7
  if(stockCheckDistance > 6 * DAY) {
    defaultHistoryDays = 30;
    if(stockCheckDistance > 20 * DAY) {
      defaultHistoryDays = 90;
      if(stockCheckDistance > 80 * DAY) {
        defaultHistoryDays = 180;
        if(stockCheckDistance > 170 * DAY) {
          defaultHistoryDays = 365;
          if(stockCheckDistance > 355 * DAY) {
            defaultHistoryDays = "all";
          }
        }
      }
    }
  }

  let historyDays: number | string = Number(url.searchParams.get("historyDays") ?? defaultHistoryDays);

  let stockHistory: Promise<StockHistoryTableRow[]>;
  if((url.searchParams.get("historyDays") ?? defaultHistoryDays) === "all") {
    historyDays = "all";
    stockHistory = db.prepare("select * from stock_history where handle = ? order by timestamp")
      .bind(
        handle
      )
      .all<StockHistoryTableRow>()
      .then(r => r.results);
  } else {
    stockHistory = db.prepare("select * from stock_history where id = ? and timestamp > ? order by timestamp")
      .bind(
        product.id,
        Date.now() - (historyDays * 24 * 60 * 60e3)
      )
      .all<StockHistoryTableRow>()
      .then(r => r.results);
  }

  const changeHistory = db.prepare("select * from change_history where id = ? order by timestamp desc")
    .bind(product.id)
    .all<{id: number, timestamp: number, field: string, old: string, new: string}>()
    .then(r => r.results);

  return {
    product,
    historyDays,
    stockHistory: await stockHistory,
    changeHistory
  }
}) satisfies PageServerLoad
