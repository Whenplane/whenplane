import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { ProductDifference, ProductsTableRow, StockHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";
import { createTables } from "../../../../(info)/lttstore/createTables.ts";


export const GET = (async ({platform, params}) => {

  if(!dev) throw error(403)

  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const data: {
    products: ProductsTableRow[],
    screwdriverStocks: StockHistoryTableRow[],
    changeHistory: {id: number, timestamp: number, field: string, old: string, new: string}[]
  } = await fetch("https://whenplane.com/api/lttstore/devData")
    .then(res => res.json());

  await createTables(db);

  let i = 0;
  for (const product of data.products) {
    console.log("Inserting (" + ++i + "/" + data.products.length + ") " + product.title);
    await db.prepare("insert or replace into products(handle, id, title, product, stock, stockChecked, lastRestock, purchasesPerHour, purchasesPerDay, regularPrice, currentPrice, firstSeen, available, backorderAlerts, productDetailModules, productDiscount) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(
        product.handle,
        product.id,
        product.title,
        product.product,
        product.stock,
        product.stockChecked,
        product.lastRestock,
        product.purchasesPerHour,
        product.purchasesPerDay,
        product.regularPrice,
        product.currentPrice,
        product.firstSeen,
        product.available,
        product.backorderAlerts,
        product.productDetailModules,
        product.productDiscount
      )
      .run();
  }

  i = 0;
  for (const stock of data.screwdriverStocks) {
    if(i % 10 === 0) console.log("Inserting " + ++i + "/" + data.screwdriverStocks.length + " screwdriver stock history");
    await db.prepare("insert or replace into stock_history(handle, id, timestamp, stock) values (?, ?, ?, ?)")
      .bind(
        stock.handle,
        stock.id,
        stock.timestamp,
        stock.stock
      )
      .run();
  }

  i = 0;
  for (const change of data.changeHistory) {
    if(i % 10 === 0) console.log("Inserting " + ++i + "/" + data.changeHistory.length + " change history");
    await db.prepare("insert or replace into change_history(id, timestamp, field, old, new) values (?, ?, ?, ?, ?)")
      .bind(
        change.id,
        change.timestamp,
        change.field,
        change.old,
        change.new
      )
      .run();
  }

  console.log("Done!")
  return json({
    done: true
  })

}) satisfies RequestHandler