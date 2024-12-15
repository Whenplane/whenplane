import type { PageLoad } from "./$types";
import { browser } from "$app/environment";


export const load = (async ({fetch}) => {


  return {
    floatplane: await fetch("/api/floatplane?fast=false&description=false&d=" + Date.now())
      .then(r => r.json())
      .catch(e => {
        console.error(e);
        return undefined;
      })
  }
}) satisfies PageLoad