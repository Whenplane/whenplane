import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";


export const GET = (async ({platform, params}) => {

  if(!dev) throw error(403)

  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const data: {
    merchMessages: MMTableRow[],
    videos: {videoId: string, status: string, title: string}[]
  } = await fetch("https://whenplane.com/api/merch-messages/devData")
    .then(res => res.json());

  await db.prepare("create table if not exists merch_messages(id text, video text, imageIndex integer, type text, text text, name text)")
    .run();
  await db.prepare("create table if not exists videos(videoId text PRIMARY KEY, status text, title text)")
    .run();

  for (const video of data.videos) {
    await db.prepare("insert or replace into videos(videoId, status, title) values (?, ?, ?)")
      .bind(video.videoId, video.status, video.title)
      .run();
  }

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