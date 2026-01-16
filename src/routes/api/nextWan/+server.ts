import { error, type RequestHandler } from "@sveltejs/kit";
import { getNextWAN } from "$lib/timeUtils";
import { text } from "@sveltejs/kit";
import { dev } from "$app/environment";

const lastRequests: {[ip: string]: number} = {};

const brownStart = 1768535204337;

export const GET = (async ({fetch, request}) => {

  const userAgent = request.headers.get("user-agent");

  if(!userAgent || userAgent.toLowerCase() === "node-fetch") {
    throw error(400, "Please change your user agent to identify your service.");
  }

  // If this is you, please contact me: https://whenplane.com/contact
  // This starts randomly failing requests more and more over 2 weeks
  if(userAgent.toLowerCase().startsWith("luna-whenplane-poller") && Math.random() < (Date.now() - brownStart) / (2 * 7 * 24 * 60 * 60e3)) {
    throw error(403, "Polling nextWan once a minute is unnecessary. Please contact me: https://whenplane.com/contact\nYour requests to this endpoint will fail more and more until January 29th (2 weeks from start), then every request will fail. Please contact me.");
  }

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