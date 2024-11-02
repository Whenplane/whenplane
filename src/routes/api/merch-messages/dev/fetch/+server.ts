import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { MMTableRow } from "$lib/merch-messages/mm-types.ts";
import { wait } from "$lib/utils.ts";


export const GET = (async ({platform, params}) => {

  if(!dev) throw error(403)

  const db: D1Database | undefined = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const data: {
    merchMessages: MMTableRow[],
    videos: {videoId: string, status: string, title: string, releaseDate: number}[]
  } = await fetch("https://whenplane.com/api/merch-messages/devData")
    .then(res => res.json());

  await db.prepare("drop table if exists merch_messages")
    .run();
  await db.prepare("drop table if exists videos")
    .run();

  await wait(500);

  await db.prepare("create table if not exists merch_messages(id text, video text, imageIndex integer, type text, text text, name text, jobId text)")
    .run();
  await db.prepare("create table if not exists videos(videoId text PRIMARY KEY, status text, title text, releaseDate integer, messageCount integer)")
    .run();

  for (const video of data.videos) {
    await db.prepare("insert or replace into videos(videoId, status, title, releaseDate) values (?, ?, ?, ?)")
      .bind(video.videoId, video.status, video.title, video.releaseDate)
      .run();
  }

  for (const mm of data.merchMessages) {
    await db.prepare("insert or replace into merch_messages(id, video, imageIndex, type, text, name, jobId) values (?, ?, ?, ?, ?, ?, ?)")
      .bind(
        mm.id,
        mm.video,
        mm.imageIndex,
        mm.type,
        mm.text,
        mm.name,
        mm.jobId
      )
      .run();
  }


  console.log("Done!")
  return json({
    done: true
  })

}) satisfies RequestHandler