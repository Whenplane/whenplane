import { error, json, type RequestHandler } from "@sveltejs/kit";
import { dev } from "$app/environment";
import type { MMShow, MMTableRow, MMV2TableRow } from "$lib/merch-messages/mm-types.ts";
import { wait } from "$lib/utils.ts";


export const GET = (async ({platform}) => {

  if(!dev) throw error(403);
  console.log("Fetching merch messages v2 data...");

  const db = platform?.env?.MERCHMESSAGES_DB;
  if(!db) throw error(503, "DB unavailable!");

  const data: {
    merchMessages: MMV2TableRow[],
    shows: MMShow[]
  } = await fetch("https://whenplane.com/api/merch-messages-v2/devData")
    .then(res => res.json());


  await db.prepare("drop table if exists merch_messages_v2")
    .run();
  await db.prepare("drop table if exists shows")
    .run();


  await wait(500);

  await db.prepare("create table if not exists merch_messages_v2(id text PRIMARY KEY, show text, timestamp integer, type text, `text` text, name text, position text, jobId text)")
    .run();
  await db.prepare("create table if not exists shows(showId text PRIMARY KEY, status text, title text, releaseDate integer, messageCount integer, replyCount integer, youtubeId text)")
    .run();


  for (const show of data.shows) {
    console.log("Inserting " + show.showId);
    await db.prepare("insert or replace into shows(showId, status, title, releaseDate, youtubeId) values (?, ?, ?, ?, ?)")
      .bind(show.showId, show.status, show.title, show.releaseDate, show.youtubeId)
      .run();
  }


  for (const mm of data.merchMessages) {
    await db.prepare("insert or replace into merch_messages_v2(id, show, timestamp, type, text, name, position, jobId) values (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(
        mm.id,
        mm.show,
        mm.timestamp,
        mm.type,
        mm.text,
        mm.name,
        mm.position,
        mm.jobId
      )
      .run();
  }



  console.log("Done!")
  return json({
    done: true
  })

}) satisfies RequestHandler