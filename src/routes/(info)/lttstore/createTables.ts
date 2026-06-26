import type { D1Database, D1DatabaseSession } from "@cloudflare/workers-types";

export async function createTables(DB: D1Database | D1DatabaseSession) {
  await Promise.all([
    DB.prepare("create table if not exists products (handle text, store integer, id integer, title text, shortTitle text, product text, stock string, metadataUpdate integer, stockChecked integer, lastRestock integer, purchasesPerHour integer, purchasesPerDay integer, regularPrice integer, currentPrice integer, firstSeen integer, available integer, backorderAlerts text, productDetailModules text, productDiscount text, differences integer, lastUpdateStart integer)")
      .run(),
    DB.prepare("create table if not exists stock_history (handle text, store integer, id integer, timestamp integer, stock string)")
      .run(),
    DB.prepare("create table if not exists change_history (store integer, id integer, timestamp integer, field TEXT, old TEXT, new TEXT)")
      .run(),
    DB.prepare("create table if not exists collections (store integer, id integer, title text, handle text, description text, published_at integer, updated_at integer, image text, reportedCount integer, products text, available integer)")
      .run(),

    DB.prepare("create table if not exists collection_changes (store integer, id integer, timestamp integer, field TEXT, old TEXT, new TEXT)")
      .run(),

    DB.prepare("create table if not exists similar_products (store integer, id integer, handle TEXT, hash TEXT, timestamp integer, similar TEXT)")
      .run(),
    DB.prepare("create table if not exists stock_totals (timestamp integer, store integer, total integer)")
      .run()
  ]);

  await Promise.all([
    DB.prepare("create index if not exists products_store_handle on products(store, handle)")
      .run(),
    DB.prepare("create index if not exists products_store on products(store)")
      .run(),
    DB.prepare("create index if not exists products_purchasesPerHour on products(purchasesPerHour)")
      .run(),
    DB.prepare("create index if not exists products_purchasesPerDay on products(purchasesPerDay)")
      .run(),
    DB.prepare("create index if not exists products_firstSeen on products(firstSeen)")
      .run(),
    DB.prepare("create index if not exists stock_history_id on stock_history(id)")
      .run(),
    DB.prepare("create index if not exists stock_history_store on stock_history(store)")
      .run(),
    DB.prepare("create index if not exists stock_history_handle_store on stock_history(handle, store)")
      .run(),
    DB.prepare("create index if not exists stock_history_id_timestamp on stock_history(id, timestamp)")
      .run(),
    DB.prepare("create index if not exists stock_history_id_store_timestamp on stock_history(id, store, timestamp)")
      .run(),
    DB.prepare("create index if not exists change_history_store_id on change_history(store, id)")
      .run(),
    DB.prepare("create index if not exists similar_products_store_id on similar_products(store, id)")
      .run(),
    DB.prepare("create index if not exists similar_products_store_handle on similar_products(store, handle)")
      .run(),
    DB.prepare("create index if not exists collection_changes_store_id on collection_changes(store, id)")
      .run(),
    DB.prepare("create unique index if not exists stock_history_unique on stock_history(id, timestamp, store)")
      .run(),
    DB.prepare("create unique index if not exists products_unique on products(id, store)")
      .run(),
    DB.prepare("create unique index if not exists change_history_unique on change_history(id, store, timestamp, field)")
      .run(),
    DB.prepare("create unique index if not exists collections_unique on collections(id, store)")
      .run(),
    DB.prepare("create unique index if not exists similar_products_unique on similar_products(store, id)")
      .run(),
    DB.prepare("create unique index if not exists collection_changes_unique on collection_changes(store, id, timestamp, field)")
      .run(),
    DB.prepare("create unique index if not exists stock_totals_unique on stock_totals(timestamp, store)")
      .run(),
  ]);

}