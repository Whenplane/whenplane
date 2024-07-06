import { error, type RequestHandler } from "@sveltejs/kit";
import { getNextWAN } from "$lib/timeUtils";
import { text } from "@sveltejs/kit";
import { dev } from "$app/environment";

const lastRequests: {[ip: string]: number} = {};

export const GET = (async ({fetch, request}) => {

  const ip = request.headers.get('cf-connecting-ip');

  if(!ip && !dev) {
    throw error(500, "Missing ip");
  }

  const lastRequest = lastRequests[ip ?? "dev"] ?? 0;

  if(Date.now() - lastRequest < 30e3) {
    throw error(429, "Rate limited! Please send less requests.");
  }

  const hasDone = await fetch("/api/hasDone")
    .then(r => r.json())
    .then(r => r.hasDone)

  lastRequests[ip ?? "dev"] = Date.now();

  return text(getNextWAN(undefined, undefined, hasDone).toISOString());
}) satisfies RequestHandler;