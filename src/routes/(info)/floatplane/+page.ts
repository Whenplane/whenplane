import type { PageLoad } from "../../../../.svelte-kit/types/src/routes";
import { browser } from "$app/environment";


export const load = (async ({fetch}) => {

  const fast = (!browser || (location && location.pathname !== "/floatplane"));

  return {
    floatplane: await fetch("/api/floatplane?fast=" + fast + "&description=true&d=" + Date.now())
      .then(r => r.json())
      .catch(e => {
        console.error(e);
        return undefined;
      })
  }
}) satisfies PageLoad