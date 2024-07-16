import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";


export const GET = (async ({platform, params}) => {

  if(!dev) throw error(403)

  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const data: {
    merchMessages: MMTableRow[]
  } = await fetch("https://whenplane.com/api/merch-messages/devData")
    .then(res => res.json());

  await db.prepare("create table if not exists merch_messages(id text, video text, imageIndex integer, type text, text text, name text)")
    .run();

  for (const mm of data.merchMessages) {
    await db.prepare("insert or replace into merch_messages(id, video, imageIndex, type, text, name) values (?, ?, ?, ?, ?, ?)")
      .bind(
        mm.id,
        mm.video,
        mm.imageIndex,
        mm.type,
        mm.text,
        mm.name
      )
      .run();
  }


  console.log("Done!")
  return json({
    done: true
  })

}) satisfies RequestHandler