import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import { sha256 } from "$lib/notifications/notificationUtils.ts";
import { dev } from "$app/environment";

export const POST = (async ({platform, request}) => {

  const db: D1Database = platform?.env?.DB;
  if(!db) throw error(503, "Database missing");

  if(dev) {
    await db.prepare(`CREATE TABLE if not exists notifications ("subscription" text PRIMARY KEY,"endpoint_hash" text,"imminent" integer DEFAULT 1,"preshow_live" integer DEFAULT 1,"mainshow_live" integer DEFAULT 1,"other_streams" integer DEFAULT 0)`)
      .run();
  }

  const subscription: PushSubscription = await request.json();
  const subscriptionString = JSON.stringify(subscription);

  const endpoint_hash = await sha256(subscription.endpoint);

  const alreadySubscribed = await db.prepare("select * from notifications where subscription=?")
    .bind(subscriptionString).all().then(r => r.results.length > 0);

  if(alreadySubscribed) {
    return json({message: "Already Subscribed"}, {status: 400});
  }

  return json(
    await db.prepare("insert into notifications (subscription, endpoint_hash) values(?, ?)")
      .bind(JSON.stringify(subscription), endpoint_hash)
      .run()
  )



}) satisfies RequestHandler;