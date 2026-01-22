import { error, type RequestHandler } from "@sveltejs/kit";
import { getNextWAN } from "$lib/timeUtils";
import { text } from "@sveltejs/kit";
import { dev, version } from "$app/environment";

const lastRequests: {[ip: string]: number} = {};

const brownStart = 1768535204337;

/*


HELLO!

If you are interested in using this endpoint, please don't send constant requests to it.
People sometimes send constant requests to this endpoint. I will block you if you do this.

Instead, please either cache it and only fetch it like once a day,
or preferably re-implement the getNextWan function as it is mostly static.

Also, make sure your user agent is googleable or has contact info for you.
That way I can reach out if you're doing something I don't like, and we can work something out,
instead of me just blocking you.


 */

export const GET = (async ({fetch, request}) => {

  const userAgent = request.headers.get("user-agent");

  if(!userAgent || userAgent.toLowerCase() === "node-fetch") {
    throw error(400, "Please change your user agent to identify your service.");
  }

  const ip = request.headers.get('cf-connecting-ip');

  if(!ip && !dev) {
    throw error(500, "Missing ip");
  }

  const lastRequest = lastRequests[ip ?? "dev"] ?? 0;

  if(Date.now() - lastRequest < 5 * 60e3) {
    throw error(429, "Rate limited! Please send less requests.");
  }

  const alternateStartTimesP = fetch("/api/alternateStartTimes?v="+version)
    .then(r => r.json());
  const hasDoneP = fetch("/api/hasDone")
    .then(r => r.json())
    .then(r => r.hasDone);

  const [alternateStartTimes, hasDone] = await Promise.all([alternateStartTimesP, hasDoneP]);

  lastRequests[ip ?? "dev"] = Date.now();

  return text(getNextWAN(undefined, undefined, alternateStartTimes, hasDone).toISOString());
}) satisfies RequestHandler;