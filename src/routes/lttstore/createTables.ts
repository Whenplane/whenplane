import type { D1Database } from "@cloudflare/workers-types";

export async function createTables(db: D1Database) {
  await db.prepare("create table if not exists products (handle text, id integer PRIMARY KEY, title text, product text, stock string, stockChecked integer, lastRestock integer, purchasesPerHour integer, purchasesPerDay integer, regularPrice integer, currentPrice integer, firstSeen integer, available integer)")
    .run();
  await db.prepare("create table if not exists stock_history (handle text, id integer, timestamp integer, stock string)")
    .run();
}