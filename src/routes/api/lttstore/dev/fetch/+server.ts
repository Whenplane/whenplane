import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import type {
  CollectionDbRow,
  ProductsTableRow, SimilarProductsTableRow,
  StockHistoryTableRow
} from "$lib/lttstore/lttstore_types.ts";
import { createTables } from "../../../../(info)/lttstore/createTables.ts";
import type {RequestHandler} from "./$types";


export const GET = (async ({platform}) => {

  if(!dev) throw error(403)

  const db = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const data: {
    products: ProductsTableRow[],
    collections: CollectionDbRow[]
    screwdriverStocks: StockHistoryTableRow[],
    changeHistory: {store: number, id: number, timestamp: number, field: string, old: string, new: string}[],
    collectionChanges: {store: number, id: number, timestamp: number, field: string, old: string, new: string}[],
    similarProducts: SimilarProductsTableRow[]
  } = await fetch("https://whenplane.com/api/lttstore/devData")
    .then(res => res.json());

  await createTables(db);

  let i = 0;
  for (const product of data.products) {
    console.log("Inserting (" + ++i + "/" + data.products.length + ") " + product.title);
    await db.prepare("insert or replace into products(store, handle, id, title, product, stock, stockChecked, metadataUpdate, lastRestock, purchasesPerHour, purchasesPerDay, regularPrice, currentPrice, firstSeen, available, backorderAlerts, productDetailModules, productDiscount, differences) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(
        product.store,
        product.handle,
        product.id,
        product.title,
        product.product,
        product.stock,
        product.stockChecked,
        product.metadataUpdate,
        product.lastRestock,
        product.purchasesPerHour,
        product.purchasesPerDay,
        product.regularPrice,
        product.currentPrice,
        product.firstSeen,
        product.available,
        product.backorderAlerts,
        product.productDetailModules,
        product.productDiscount,
        product.differences
      )
      .run();
  }

  i = 0;
  for (const product of data.similarProducts) {
    console.log("Inserting similar product (" + ++i + "/" + data.similarProducts.length + ") " + product.handle);
    await db.prepare("insert or replace into similar_products(store, id, handle, hash, timestamp, similar) values (?, ?, ?, ?, ?, ?)")
      .bind(
        product.store,
        product.id,
        product.handle,
        product.hash,
        product.timestamp,
        product.similar
      )
      .run();
  }

  i = 0;
  for (const collection of data.collections) {
    console.log("Inserting (" + ++i + "/" + data.collections.length + ") " + collection.title);
    await db.prepare("insert or replace into collections(store, handle, id, title, description, published_at, updated_at, image, reportedCount, products, available) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(
        collection.store,
        collection.handle,
        collection.id,
        collection.title,
        collection.description,
        collection.published_at,
        collection.updated_at,
        collection.image,
        collection.reportedCount,
        collection.products,
        collection.available
      )
      .run();
  }

  i = 0;
  for (const stock of data.screwdriverStocks) {
    i++;
    if(i % 10 === 0) console.log("Inserting " + i + "/" + data.screwdriverStocks.length + " screwdriver stock history");
    await db.prepare("insert or replace into stock_history(store, handle, id, timestamp, stock, store) values (?, ?, ?, ?, ?, ?)")
      .bind(
        stock.store,
        stock.handle,
        stock.id,
        stock.timestamp,
        stock.stock,
        stock.store
      )
      .run();
  }

  i = 0;
  for (const change of data.changeHistory) {
    i++;
    if(i % 10 === 0) console.log("Inserting " + i + "/" + data.changeHistory.length + " change history");
    await db.prepare("insert or replace into change_history(store, id, timestamp, field, old, new) values (?, ?, ?, ?, ?, ?)")
      .bind(
        change.store,
        change.id,
        change.timestamp,
        change.field,
        change.old,
        change.new
      )
      .run();
  }

  i = 0;
  for (const change of data.collectionChanges) {
    i++;
    if(i % 10 === 0) console.log("Inserting " + i + "/" + data.collectionChanges.length + " collection change history");
    await db.prepare("insert or replace into collection_changes(store, id, timestamp, field, old, new) values (?, ?, ?, ?, ?, ?)")
      .bind(
        change.store,
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