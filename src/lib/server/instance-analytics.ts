import { dev } from "$app/environment";
import type { IncomingRequestCfProperties } from "@cloudflare/workers-types";

const SERVICE = "whenplane";

const instanceId = Date.now().toString(36) + "." + crypto.randomUUID()


let lastSend = 0;

export async function report(cf: IncomingRequestCfProperties) {
  if(dev) {
    console.warn("Cannot report instance in dev!")
    return;
  }

  // only ping at most once every 30 seconds
  if(Date.now() - lastSend < 15e3) return;

  lastSend = Date.now();

  const colo = cf.colo;

  const searchParams = new URLSearchParams();

  searchParams.set("id", instanceId);
  searchParams.set("colo", colo);
  searchParams.set("service", SERVICE)

  await fetch("https://cf-instance-analytics.ajg0702.us/ping?" + searchParams.toString(), {
    method: "POST"
  })
}