import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { TimestampsDbRow } from "$lib/timestamps/types.ts";


export const GET = (async ({platform}) => {


  const topics = platform?.env?.TOPICS;
  if (!topics) throw error(503, "Missing topics db!");

  const timestamps = await topics.prepare("select * from timestamps")
    .all<TimestampsDbRow>()
    .then(r => r.results);

  return json(timestamps);

}) satisfies RequestHandler