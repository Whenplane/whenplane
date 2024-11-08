import { dev } from "$app/environment";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import {wait } from "$lib/utils.ts";
import type { TimestampsDbRow } from "$lib/timestamps/types.ts";

export const GET = (async ({platform, fetch}) => {
  if(!dev) throw error(503, "Not available in prod");

  const topics = platform?.env?.TOPICS;
  if(!topics) throw error(503, "Missing topics db!");

  await createTables(topics);

  const timestamps: TimestampsDbRow[] = await fetch("https://whenplane.pages.dev/api/timestamps/devData")
    .then(r => {console.log("devData fetched"); return r;})
    .then(r => r.json());

  console.log("devData parsed")


  let count = 0;
  /*const promises: Promise<any>[] = [];
  for (const timestamp of timestamps) {
    promises.push(
      topics.prepare("insert or replace into timestamps (id, videoId, time, timeString, name, parent) values (?, ?, ?, ?, ?, ?)")
        .bind(...Object.values(timestamp))
        .run()
        .then(() => {
          if(count++ % 1000 === 0) {
            console.log("Inserted " + count + " / " + timestamps.length)
          }
        })
    )
  }
  await Promise.all(promises);*/

  const chunkSize = 100;
  for (let i = 0; i < timestamps.length; i += chunkSize) {
    const chunk = timestamps.slice(i, i + chunkSize);
    const promises: Promise<any>[] = [];
    // console.log("Starting chunk")
    for (const timestamp of chunk) {
      topics.prepare("insert or replace into timestamps (id, videoId, time, timeString, name, parent) values (?, ?, ?, ?, ?, ?)")
        .bind(...Object.values(timestamp))
        .run()
        .then(() => {
          if(++count % 100 === 0 || count === timestamps.length) {
            console.log("Inserted " + count + " / " + timestamps.length)
          }
        })
    }
    await Promise.all(promises);
    await wait(100)
  }

  return json({done: true})


}) satisfies RequestHandler;








async function createTables(topics: D1Database) {
  await topics.prepare("create table if not exists timestamps (id text PRIMARY KEY, videoId text, time number, timeString text, name text, parent text)")
    .run();
  await topics.prepare("create table if not exists timestamp_videos (videoId text PRIMARY KEY, sectionHash text)")
    .run()

  await topics.prepare("create index if not exists timestamps_videoId on timestamps(videoId)").run()
  await topics.prepare("create index if not exists timestamps_videos_videoId on timestamp_videos(videoId)").run()
}