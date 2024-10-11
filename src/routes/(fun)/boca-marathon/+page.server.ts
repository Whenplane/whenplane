import { error } from "@sveltejs/kit";
import type { NotablePeopleShortResponse } from "../../api/(live-statuses)/notable-streams/+server.ts";
import {D1Database} from "@cloudflare/workers-types";
import { dev } from "$app/environment";

export const load = (async ({platform, fetch}) => {

  const currentStream = "boca-and-sammy-10-2024"
  const cutoff_time = 1728757531523;

  const db: D1Database | undefined = platform?.env?.DB;
  if(!db) throw error(503, "Database missing");

  if(dev) {
    await db.prepare("create table if not exists boca_events (event_name text, event_timestamp number, stream text)")
      .run();
  }

  const liveData: NotablePeopleShortResponse = await fetch("/api/notable-streams")
    .then(r => r.json())
    .then(r => r.bocabola_ as NotablePeopleShortResponse);

  if(!liveData) throw error(503, "Boca live data missing");

  const pastData = await db.prepare("select * from boca_events where stream = ?")
    .bind(currentStream)
    .all().then(r => r.results) as {event_name: string, event_timestamp: number}[];

  if(Date.now() < cutoff_time && liveData.isLive) {
    if(!pastData.find(e => e.event_name === "streamStart")) {
      const startTime = new Date(liveData.started).getTime()
      await db.prepare("insert into boca_events (event_name, event_timestamp, stream), (?, ?, ?)")
        .bind("streamStart", startTime, currentStream);
      pastData.push({
        event_name: "streamStart",
        event_timestamp: startTime
      })
    }

    if(!pastData.find(e => e.event_name === "start_" + liveData.game)) {
      const eventName = "start_" + liveData.game
      const startTime = Date.now();
      console.log("Adding game " + eventName + " with start time of " + startTime)
      await db.prepare("insert into boca_events (event_name, event_timestamp, stream), (?, ?, ?)")
        .bind(eventName, startTime, currentStream).run();
      pastData.push({
        event_name: eventName,
        event_timestamp: startTime
      })
    }
  } else {
    console.log("past cutoff or not live!")
  }

  return {
    pastData,
    liveData
  }

})