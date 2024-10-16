import { getSession } from "$lib/server/auth.ts";
import {type PageServerLoad} from "./$types";

export const load = (async ({platform, cookies}) => {

  return {session: await getSession(platform, cookies.get("session"))}

}) satisfies PageServerLoad