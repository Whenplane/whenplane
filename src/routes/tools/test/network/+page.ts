import type {PageLoad} from "./$types";


export const prerender = false;

export const load = (async ({fetch}) => {

  const test = await fetch("/api/aggregate")
    .then(r => r.json())
    .catch(() => {
      return { offline: true }
    });

  return {test}

}) satisfies PageLoad;