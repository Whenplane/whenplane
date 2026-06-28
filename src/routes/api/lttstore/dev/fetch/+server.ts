import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import type {
  ChangeHistoryTableRow,
  CollectionDbRow,
  ProductsTableRow, SimilarProductsTableRow,
  StockHistoryTableRow
} from "$lib/lttstore/lttstore_types.ts";
import { createTables } from "../../../../(info)/lttstore/createTables.ts";
import type {RequestHandler} from "./$types";
import { chunkArray, commas, retry, wait } from "$lib/utils.ts";


export const GET = (async ({platform}) => {

  if(!dev) throw error(403)

  const db = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  const data: {
    products: ProductsTableRow[],
    collections: CollectionDbRow[]
    screwdriverStocks: StockHistoryTableRow[],
    similarProducts: SimilarProductsTableRow[]
  } = await fetch("https://whenplane.com/api/lttstore/devData")
    .then(res => res.json());

  await createTables(db);

  let i = 0;
  for (const product of data.products) {
    console.log("Inserting (" + ++i + "/" + data.products.length + ") " + product.title);
    await db
      .prepare("insert or replace into products(store, handle, id, title, product, stock, stockChecked, metadataUpdate, lastRestock, purchasesPerHour, purchasesPerDay, regularPrice, currentPrice, firstSeen, available, backorderAlerts, productDetailModules, productDiscount, differences, shortTitle) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
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
        product.differences,
        product.shortTitle
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

  console.log("Fetching allChangeHistory");
  const changeHistoryStart = Date.now();
  let changeHistory: ChangeHistoryTableRow[] = [];
  let nextOffset: number | undefined = 0;
  let hasNextPage = true;
  do {
    const {changeHistory: newChangeHistory, page} = await retry(() =>
      fetch(`https://whenplane.com/api/lttstore/allChangeHistory?perPage=500&offset=${nextOffset}`)
        .then(r => {
          if(!r.ok) throw new Error(`Got ${r.status} ${r.statusText} from allChangeHistory endpoint`);
          return r.json() as Promise<{changeHistory: ChangeHistoryTableRow[], page: {perPage: number, hasNextPage: boolean, nextOffset: number | undefined}}>;
        })
    );
    nextOffset = page.nextOffset;
    hasNextPage = page.hasNextPage;
    changeHistory.push(...newChangeHistory);
    const last = newChangeHistory.pop();

    // Stop once we pass 90 days ago
    if(!last || Date.now() - last.timestamp > 90 * 24 * 60 * 60e3) break;
  } while(hasNextPage && nextOffset !== undefined);

  console.log(`Fetched ${commas(changeHistory.length)} change history entries in ${commas(Date.now() - changeHistoryStart)}ms`);

  const collectionChangeHistoryP = (async () => {
    console.log("Fetching allCollectionChangeHistory");
    const collectionChangeHistoryStart = Date.now();
    let collectionChangeHistory: ChangeHistoryTableRow[] = [];
    let nextOffset: number | undefined = 0;
    let hasNextPage = true;
    do {
      const {changeHistory: newChangeHistory, page} = await retry(() =>
        fetch(`https://whenplane.com/api/lttstore/allCollectionChangeHistory?perPage=500&offset=${nextOffset}`)
          .then(r => {
            if(!r.ok) throw new Error(`Got ${r.status} ${r.statusText} from allCollectionChangeHistory endpoint`);
            return r.json() as Promise<{changeHistory: ChangeHistoryTableRow[], page: {perPage: number, hasNextPage: boolean, nextOffset: number | undefined}}>;
          })
      );
      nextOffset = page.nextOffset;
      hasNextPage = page.hasNextPage;
      collectionChangeHistory.push(...newChangeHistory);
      const last = newChangeHistory.pop();

      // Stop once we pass 90 days ago
      if(!last || Date.now() - last.timestamp > 90 * 24 * 60 * 60e3) break;

      await wait(1e3);
    } while(hasNextPage && nextOffset !== undefined);

    console.log(`Fetched ${commas(collectionChangeHistory.length)} change history entries in ${commas(Date.now() - collectionChangeHistoryStart)}ms`);
    return collectionChangeHistory;
  })()

  await (async () => {
    let i = 0;
    const chunks = chunkArray(changeHistory, 5);
    for (let chunk of chunks) {
      await Promise.all(chunk.map(change =>
        db.prepare("insert or replace into change_history(store, id, timestamp, field, old, new) values (?, ?, ?, ?, ?, ?)")
          .bind(
            change.store,
            change.id,
            change.timestamp,
            change.field,
            change.old,
            change.new
          )
          .run()
          .then(() => {
            i++;
            if(i % 50 === 0) console.log("Inserted " + i + "/" + changeHistory.length + " product change history");
          })
      ))
    }
  })()

  const collectionChangeHistory = await collectionChangeHistoryP;

  await (async () => {
    let i = 0;
    const chunks = chunkArray(collectionChangeHistory, 5);
    for (let chunk of chunks) {
      await Promise.all(chunk.map(change =>
        db.prepare("insert or replace into collection_changes(store, id, timestamp, field, old, new) values (?, ?, ?, ?, ?, ?)")
          .bind(
            change.store,
            change.id,
            change.timestamp,
            change.field,
            change.old,
            change.new
          )
          .run()
          .then(() => {
            i++;
            if(i % 50 === 0) console.log("Inserted " + i + "/" + collectionChangeHistory.length + " collection change history");
          })
      ))
    }
  })()

  console.log("Done!")
  return json({
    done: true
  })

}) satisfies RequestHandler