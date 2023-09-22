import type { LayoutLoad } from "./$types";
import type { HistoricalEntry } from "$lib/utils";

export const load = (async ({fetch, url}) => {
  const allShows: HistoricalEntry[] = [];
  const currentShows = fetch("/api/history/year/all").then(r => r.json());
  const oldShows = fetch("/api/oldShows?removeDescription").then(r => r.json());
  allShows.push(...(await currentShows));
  allShows.push(...(await oldShows));

  return {
    records: await fetch("/api/history/records").then(r => r.json()),
    allShows
  }
}) satisfies LayoutLoad