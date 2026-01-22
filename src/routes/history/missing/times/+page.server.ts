import type { HistoricalEntry } from "$lib/utils.ts";
import {GET as oldShowsGet} from "../../../api/oldShows/+server.ts"
import type { PageServerLoad } from "./$types";
import type { RequestEvent as OldShowsRequestEvent } from "../../../../../.svelte-kit/types/src/routes/api/oldShows/$types";
import { version } from "$app/environment";
import type { AlternateTimeRow } from "../../../api/alternateStartTimes/+server.ts";


export const load = (async () => {

  return {
    oldShows: await oldShowsGet({url: new URL("https://prerender/api/oldShows?removeDescription")} as OldShowsRequestEvent)
      .then(r => r.json()) as HistoricalEntry[],
    alternateStartTimes: await fetch("/api/alternateStartTimes?v=" + version)
      .then(r => r.json() as Promise<AlternateTimeRow[]>)
  }

}) satisfies PageServerLoad;