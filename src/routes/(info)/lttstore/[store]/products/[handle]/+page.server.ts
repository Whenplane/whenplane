import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { dev } from "$app/environment";
import {
  type ProductsTableRow,
  type ShopifyProduct,
  type SimilarProductsTableRow,
  type StockHistoryTableRow, storeIdFromName
} from "$lib/lttstore/lttstore_types.ts";

import { createTables } from "../../../createTables.ts";
import { retry, retryD1 } from "$lib/utils.ts";
import { productRedirects } from "$lib/lttstore/product_redirects.ts";
import { page } from "$app/state";

const DAY = 24 * 60 * 60e3;


export const load = (async ({platform, params, url, fetch}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db)

  const handle = params.handle;

  const store = storeIdFromName(params.store);

  // if the "handle" parameter is a number, then it's probably actually an id.
  // Look up its handle and redirect if it is.
  const handleNumber = Number(handle);
  if(!Number.isNaN(handleNumber)) {
    const productHandle = await retryD1(() =>
      db.prepare("select handle from products where id = ? and store = ?")
      .bind(handleNumber, store)
      .first<{handle: string}>()
      .then(r => r?.handle)
    );
    if(productHandle) throw redirect(301, productHandle)
  }

  const product = await retryD1(() =>
    db.prepare("select * from products where handle = ? and store = ?")
      .bind(handle, store)
      .first<ProductsTableRow>()
  );

  if(product == null) {
    const to = productRedirects[handle];
    if(to) {
      throw redirect(301, to);
    } else {
      throw error(404, "Product not found!");
    }
  }


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

  const firstSeenDistance = Date.now() - product.firstSeen;
  if(firstSeenDistance < 2 * DAY) {
    defaultHistoryDays = 1;
  }


  let historyDays: number | string = Number(url.searchParams.get("historyDays") ?? defaultHistoryDays);
  const stockAsOf = Date.now();

  let stockHistory: Promise<StockHistoryTableRow[]>;
  if((url.searchParams.get("historyDays") ?? defaultHistoryDays) === "all") {
    historyDays = "all";
    stockHistory = retryD1(() =>
      db.prepare("select timestamp,stock from stock_history where (id = ? or handle = ?) and store = ? order by timestamp")
        .bind(product.id, handle, store)
        .all<StockHistoryTableRow>()
        .then(r => r.results)
    );
  } else {
    stockHistory = retryD1(() =>
      db.prepare("select timestamp,stock from stock_history where (id = ? or handle = ?) and store = ? and timestamp > ? order by timestamp")
        .bind(
          product.id,
          handle,
          store,
          // go 12 hours past the actual cutoff, so we hopefully have a line to draw from the past
          Date.now() - ((historyDays as number) * 24 * 60 * 60e3) - (12 * 60 * 60e3),
        )
        .all<StockHistoryTableRow>()
        .then(r => r.results)
    );
  }

  const initialChangeHistory = retry(() =>
    fetch(`/api/lttstore/${params.store}/products/${product.handle}/changeHistory?offset=0&perPage=10`)
      .then(r => r.json())
  );

  const similarProducts = retryD1(() =>
    db.prepare("select * from similar_products where id = ? and store = ?")
      .bind(product.id, store)
      .first<SimilarProductsTableRow>()
      .then(r => r ? {timestamp: r.timestamp, similar: JSON.parse(r.similar).filter((p: ShopifyProduct) => p.id != product.id)} : r)
  );
  
  return {
    product,
    historyDays,
    defaultHistoryDays,
    stockHistory: await stockHistory,
    initialChangeHistory,
    similarProducts,
    stockAsOf
  }
}) satisfies PageServerLoad
