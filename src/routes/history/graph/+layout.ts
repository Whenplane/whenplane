import type { LayoutLoad } from "./$types";
import type { HistoricalEntry } from "$lib/utils";
import { version } from "$app/environment";
import type { AlternateTimeRow } from "../../api/alternateStartTimes/+server.ts";

export const load = (async ({fetch, url}) => {
  const allShows: HistoricalEntry[] = [];
  const currentShows = fetch("/api/history/year/all").then(r => r.json());
  const oldShows = fetch("/api/oldShows?removeDescription").then(r => r.json());
  const alternateStartTimesP = fetch("/api/alternateStartTimes?v=" + version)
    .then(r => r.json() as Promise<AlternateTimeRow[]>);
  allShows.push(...(await currentShows));
  allShows.push(...(await oldShows));

  return {
    records: await fetch("/api/history/records").then(r => r.json()),
    allShows,
    alternateStartTimes: await alternateStartTimesP
  }
}) satisfies LayoutLoad