import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { Timestamp, TimestampsDbRow } from "$lib/timestamps/types.ts";


export const GET = (async ({platform, params}) => {

  const videoId = params.videoId;
  if(!videoId) throw error(400, "Missing video id!");

  const topics = platform?.env?.TOPICS;
  if (!topics) throw error(503, "Missing topics db!");

  const timestamps = await topics.prepare("select * from timestamps where videoId = ? order by time asc")
    .bind(videoId)
    .all<TimestampsDbRow>()
    .then(r => r.results);

  function recurseChildren(row: TimestampsDbRow) {
    const timestamp = translate(row);
    timestamp.subTimestamps = timestamps.filter(t => t.parent === row.id).map(recurseChildren);

    return timestamp;
  }

  const parsedTimestamps: Timestamp[] = [];

  const parents = timestamps.filter(t => t.parent === null);
  parsedTimestamps.push(...parents.map(recurseChildren));

  return json(parsedTimestamps);

}) satisfies RequestHandler;

function translate(row: TimestampsDbRow): Timestamp {
  return {
    time: row.time,
    timeString: row.timeString,
    name: row.name,
    subTimestamps: []
  }
}