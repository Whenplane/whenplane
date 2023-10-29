import type { HistoricalEntry } from "$lib/utils.ts";


export const load = (async ({fetch}) => {

  return {
    oldShows: await fetch("/api/oldShows?removeDescription").then(r => r.json()) as HistoricalEntry[]
  }

}) satisfies PageServerLoad;