import type { HistoricalEntry } from "$lib/utils.ts";
import {GET as oldShowsGet} from "../../../api/oldShows/+server.ts"


export const load = (async () => {

  return {
    oldShows: await oldShowsGet({url: new URL("https://prerender/api/oldShows?removeDescription")}).then(r => r.json()) as HistoricalEntry[]
  }

}) satisfies PageServerLoad;