import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import { createNotificationsTable } from "$lib/server/notifications/notification-server-tools.ts";

export const GET = (async ({ url, platform, cookies }) => {

  const session = platform?.env?.DB.withSession(cookies.get("notificationSettingConsistency"));
  if(!session) throw error(503, "Database missing");

  const hash = url.searchParams.get("hash");
  if(!hash) throw error(400, "Missing hash");

  if(dev) {
    await createNotificationsTable(session);
  }

  const settings: NotificationRows | undefined = await session.prepare("select * from notifications where endpoint_hash = ?")
    .bind(hash)
    .all()
    .then(r => {
      if(r.results.length == 0) return undefined;
      return (r.results[0]) as unknown as NotificationRows;
    });

  if(!settings) throw error(404, "Hash not found");

  delete settings.subscription;

  return json(settings);

}) satisfies RequestHandler;

export const PUT = (async ({url, request, platform, cookies}) => {
  const session = platform?.env?.DB.withSession(cookies.get("notificationSettingConsistency"));
  if(!session) throw error(503, "Database missing");

  const hash = url.searchParams.get("hash");
  if(!hash) throw error(400, "Missing hash");

  const data = await request.json() as NotificationRows;

  const response = await session.prepare("update notifications set imminent=?, preshow_live=?, mainshow_live=?, other_streams=?, elijah_stream=? where endpoint_hash=?")
    .bind(data.imminent, data.preshow_live, data.mainshow_live, data.other_streams, data.elijah_stream, hash)
    .run()

  const bookmark = session.getBookmark();
  if(bookmark) {
    cookies.set("notificationSettingConsistency", bookmark, {
      path: "/",
      // 5 minutes is MORE than enough time for the db write to be replicated
      // (according to the blog post, its usually under 100ms)
      expires: new Date(Date.now() + (5 * 60e3)),
      secure: dev ? false : undefined
    })
  }

  return json(response, {status: response.success ? 200 : 500});
}) satisfies RequestHandler;

export type NotificationRows = {
  subscription?: string,
  endpoint_hash: string,
  imminent: boolean
  preshow_live: boolean,
  mainshow_live: boolean,
  other_streams: boolean,
  elijah_stream: boolean
}