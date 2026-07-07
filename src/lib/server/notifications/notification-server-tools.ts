import type { D1Database, D1DatabaseSession } from "@cloudflare/workers-types";

export async function createNotificationsTable(db: D1Database | D1DatabaseSession) {
  await db.prepare(`CREATE TABLE if not exists notifications ("subscription" text PRIMARY KEY,"endpoint_hash" text,"imminent" integer DEFAULT 1,"preshow_live" integer DEFAULT 1,"mainshow_live" integer DEFAULT 1,"other_streams" integer DEFAULT 0,"elijah_stream" integer DEFAULT 0)`)
    .run();
  await db.prepare(`create index if not exists notifications_imminent on notiications("imminent")`).run();
  await db.prepare(`create index if not exists notifications_preshow_live on notiications("preshow_live")`).run();
  await db.prepare(`create index if not exists notifications_mainshow_live on notiications("mainshow_live")`).run();
  await db.prepare(`create index if not exists notifications_other_streams on notiications("other_streams")`).run();
  await db.prepare(`create index if not exists notifications_elijah_stream on notiications("elijah_stream")`).run();
  await db.prepare(`create index if not exists notifications_endpoint_hash on notiications("endpoint_hash")`).run();
}