import { error } from "@sveltejs/kit";
import type { NotablePeopleShortResponse } from "../../api/(live-statuses)/notable-streams/+server.ts";
import { type D1Database, type KVNamespace } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import {type PageServerLoad} from "./$types"

export const load = (async ({platform, fetch}) => {

  const currentStream = "boca-and-sammy-10-2024"
  const cutoff_time = 1728757531523;

  const db: D1Database | undefined = platform?.env?.DB;
  const meta: KVNamespace | undefined = platform?.env?.META;
  if(!db) throw error(503, "Database missing");
  if(!meta) throw error(503, "Meta missing");

  if(dev) {
    await db.prepare("create table if not exists boca_events (event_name text, event_timestamp number, stream text)")
      .run();
  }

  const liveData: NotablePeopleShortResponse = await fetch("/api/notable-streams")
    .then(r => r.json())
    .then(r => r.bocabola_ as NotablePeopleShortResponse);

  if(!liveData) throw error(503, "Boca live data missing");

  const pastData = await db.prepare("select * from boca_events where stream = ? order by event_timestamp DESC")
    .bind(currentStream)
    .all().then(r => r.results) as {event_name: string, event_timestamp: number}[];

  if(Date.now() < cutoff_time && liveData.isLive) {

    const lastGame = await meta.get("boca_marathon_currentGame");

    if(!pastData.find(e => e.event_name === "streamStart")) {
      console.log("Adding stream start time")
      const startTime = new Date(liveData.started).getTime()
      await db.prepare("insert into boca_events (event_name, event_timestamp, stream) values (?, ?, ?)")
        .bind("streamStart", startTime, currentStream);
      pastData.push({
        event_name: "streamStart",
        event_timestamp: startTime
      })
    }

    if(lastGame !== liveData.game) {
      const eventName = "start_" + liveData.game
      const startTime = Date.now();
      console.log("Adding game " + eventName + " with start time of " + startTime)
      await db.prepare("insert into boca_events (event_name, event_timestamp, stream) values (?, ?, ?)")
        .bind(eventName, startTime, currentStream).run();
      pastData.push({
        event_name: eventName,
        event_timestamp: startTime
      })
      await meta.put("boca_marathon_currentGame", liveData.game);
    }
  } else {
    console.log("past cutoff or not live!")
  }

  return {
    pastData,
    liveData
  }

}) satisfies PageServerLoad