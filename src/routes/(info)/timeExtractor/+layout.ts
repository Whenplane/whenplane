import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import type { AlternateTimeRow } from "../../api/alternateStartTimes/+server.ts";

export const load = (async () => {
  if(!dev) throw error(503, "Not available in prod");
  return {
    alternateStartTimes: await fetch("/api/alternateStartTimes")
      .then(r => r.json() as Promise<AlternateTimeRow[]>)
  };
}) satisfies LayoutLoad;