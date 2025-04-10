import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import { sha256 } from "$lib/notifications/notificationUtils.ts";
import { dev } from "$app/environment";
import { createNotificationsTable } from "$lib/server/notifications/notification-server-tools.ts";

export const POST = (async ({platform, request, cookies}) => {

  const session = platform?.env?.DB.withSession(cookies.get("notificationSettingConsistency"));
  if(!session) throw error(503, "Database missing");

  if(dev) {
    await createNotificationsTable(session);
  }

  const subscription: PushSubscription = await request.json();
  const subscriptionString = JSON.stringify(subscription);

  const endpoint_hash = await sha256(subscription.endpoint);

  const alreadySubscribed = await session.prepare("select * from notifications where subscription=?")
    .bind(subscriptionString).all().then(r => r.results.length > 0);

  if(alreadySubscribed) {
    return json({message: "Already Subscribed"}, {status: 400});
  }

  cookies.set("notificationSettingConsistency", session?.getBookmark(), {
    path: "/",
    // 5 minutes is MORE than enough time for the db write to be replicated
    // (according to the blog post, its usually under 100ms)
    expires: new Date(Date.now() + (5 * 60e3)),
    secure: dev ? false : undefined
  })

  return json(
    await session.prepare("insert into notifications (subscription, endpoint_hash) values(?, ?)")
      .bind(JSON.stringify(subscription), endpoint_hash)
      .run()
  )

}) satisfies RequestHandler;