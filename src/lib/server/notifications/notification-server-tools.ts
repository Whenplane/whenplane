import type { D1Database } from "@cloudflare/workers-types";

export async function createNotificationsTable(db: D1Database) {
  await db.prepare(`CREATE TABLE if not exists notifications ("subscription" text PRIMARY KEY,"endpoint_hash" text,"imminent" integer DEFAULT 1,"preshow_live" integer DEFAULT 1,"mainshow_live" integer DEFAULT 1,"other_streams" integer DEFAULT 0)`)
    .run();
}