import type { D1Database, D1DatabaseSession } from "@cloudflare/workers-types";

export async function createTables(DB: D1Database | D1DatabaseSession) {
  await DB.prepare("create table if not exists products (handle text, id integer PRIMARY KEY, title text, product text, stock string, metadataUpdate integer, stockChecked integer, lastRestock integer, purchasesPerHour integer, purchasesPerDay integer, regularPrice integer, currentPrice integer, firstSeen integer, available integer, backorderAlerts text, productDetailModules text, productDiscount text)")
    .run();
  await DB.prepare("create table if not exists stock_history (handle text, id integer, timestamp integer, stock string)")
    .run();
  await DB.prepare("create table if not exists change_history (id integer, timestamp integer, field TEXT, old TEXT, new TEXT)")
    .run();
  await DB.prepare("create table if not exists collections (id integer PRIMARY KEY, title text, handle text, description text, published_at integer, updated_at integer, image text, reportedCount integer, products text, available integer)")
    .run();

  await DB.prepare("create table if not exists collection_changes (id integer, timestamp integer, field TEXT, old TEXT, new TEXT)")
    .run();

  await DB.prepare("create table if not exists product_carts (id integer PRIMARY KEY, cookies text)")
    .run();

  await DB.prepare("create table if not exists similar_products (id interger PRIMARY KEY, handle TEXT, hash TEXT, timestamp integer, similar TEXT)")
    .run();
}