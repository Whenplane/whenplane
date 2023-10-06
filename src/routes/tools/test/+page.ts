import type { PageLoad } from "./$types";


export let load = (async ({fetch}) => {
  return {
    liveStatus: {
      votes: await fetch("/api/latenessVoting/votes").then(r => r.json())
    }
  }
}) satisfies PageLoad