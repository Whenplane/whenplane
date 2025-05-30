import { error } from "@sveltejs/kit";
import type { NotablePeopleShortResponse } from "../../api/(live-statuses)/notable-streams/+server.ts";
import { type KVNamespace } from "@cloudflare/workers-types";
import { dev } from "$app/environment";
import type { PageServerLoad } from "./$types";

export const load = (async ({platform, fetch}) => {

  const currentStream = "boca-and-sammy-10-2024"
  const cutoff_time = 1728801407090;

  const db = platform?.env?.DB?.withSession();
  const meta: KVNamespace | undefined = platform?.env?.META;
  if(!db) throw error(503, "Database missing");
  if(!meta) throw error(503, "Meta missing");

  if(dev) {
    await db.prepare("create table if not exists boca_events (event_name text, event_timestamp number, stream text)")
      .run();
    await db.prepare("create table if not exists boca_meta (key text, value text)")
      .run();
  }

  const liveData: NotablePeopleShortResponse = await fetch("/api/notable-streams")
    .then(r => r.json())
    .then(r => r.bocabola as NotablePeopleShortResponse);

  if(!liveData) throw error(503, "Boca live data missing");

  const pastData = await db.prepare("select * from boca_events where stream = ? order by event_timestamp DESC")
    .bind(currentStream)
    .all().then(r => r.results) as {event_name: string, event_timestamp: number}[];

  if(Date.now() < cutoff_time && liveData.isLive) {

    if(!pastData.find(e => e.event_name === "streamStart")) {
      console.log("Adding stream start time")
      const startTime = new Date(liveData.started ?? "").getTime()
      await db.prepare("insert into boca_events (event_name, event_timestamp, stream) values (?, ?, ?)")
        .bind("streamStart", startTime, currentStream).run();
      pastData.unshift({
        event_name: "streamStart",
        event_timestamp: startTime
      })
    }

    const lastGame = (await db.prepare("select value from boca_meta where key='marathon_currentGame'").first<{value: string}>())?.value ??
      await meta.get("boca_marathon_currentGame");

    if(lastGame !== liveData.game) {

      await db.prepare("insert or replace into boca_meta(key, value) values(?, ?)")
        .bind("marathon_currentGame", liveData.game).run();

      const eventName = "start_" + liveData.game
      const startTime = Date.now();
      console.log("Adding game " + eventName + " with start time of " + startTime)
      await db.prepare("insert into boca_events (event_name, event_timestamp, stream) values (?, ?, ?)")
        .bind(eventName, startTime, currentStream).run();
      pastData.push({
        event_name: eventName,
        event_timestamp: startTime
      })
      // await meta.put("boca_marathon_currentGame", liveData.game ?? "");
    } else if(Date.now() - pastData[0].event_timestamp > 15e3 && Math.random() < 0.05) {

      const remove: {event_name: string, event_timestamp: number}[] = [];

      for (let i = 0; i < pastData.length; i++) {
        const thisEvent = pastData[i];
        const nextEvent = pastData[i-1];

        const length = nextEvent ? nextEvent.event_timestamp - thisEvent.event_timestamp : Date.now() - thisEvent.event_timestamp;

        if(length < 15e3) remove.push(thisEvent);
      }
      remove.pop() // remove the last (oldest) element, since that should be the most accurate
      if(remove.length > 0) remove.push(pastData[0]); // add first element, as it usually wouldnt meet above requirements and is the furthest off

      console.log("I'm removing", remove);

      const removePromises: Promise<unknown>[] = [];
      for (const eventRemove of remove) {
        removePromises.push(
          db.prepare("delete from boca_events where stream=? and event_name=? and event_timestamp=?")
            .bind(currentStream, eventRemove.event_name, eventRemove.event_timestamp)
            .run()
        )
      }

      platform?.context?.waitUntil(Promise.all(removePromises));


    }
  } if(!liveData.isLive && Date.now() < cutoff_time) {
    if(!pastData.find(e => e.event_name === "streamEnd")) {
      console.log("Adding stream end time")
      const endTime = Date.now();
      await db.prepare("insert into boca_events (event_name, event_timestamp, stream) values (?, ?, ?)")
        .bind("streamEnd", endTime, currentStream).run();
      pastData.unshift({
        event_name: "streamEnd",
        event_timestamp: endTime
      })
    }
  } else {
    console.log("past cutoff or not live!")
  }

  return {
    pastData,
    liveData,
    reloadNumber: 3
  }

}) satisfies PageServerLoad