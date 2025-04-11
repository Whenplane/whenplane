import type { HistoricalEntry } from "$lib/utils.ts";
import {GET as oldShowsGet} from "../../../api/oldShows/+server.ts"
import type { PageServerLoad } from "./$types";
import type { RequestEvent as OldShowsRequestEvent } from "../../../../../.svelte-kit/types/src/routes/api/oldShows/$types";


export const load = (async () => {

  return {
    oldShows: await oldShowsGet({url: new URL("https://prerender/api/oldShows?removeDescription")} as OldShowsRequestEvent)
      .then(r => r.json()) as HistoricalEntry[]
  }

}) satisfies PageServerLoad;