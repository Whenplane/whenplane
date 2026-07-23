import type { PageLoad } from "./$types";
import { browser } from "$app/environment";


export const load = (async ({fetch}) => {

  const fast = (!browser || (location && location.pathname !== "/floatplane"));

  return {
    floatplane: await fetch("/api/floatplane?fast=" + fast + "&description=true")
      .then(r => r.json())
      .catch(e => {
        console.error(e);
        return undefined;
      })
  }
}) satisfies PageLoad