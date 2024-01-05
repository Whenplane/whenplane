import type { D1Database } from "@cloudflare/workers-types";
import type { Actions } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";
import { latenessVotesCache } from "$lib/stores.ts";
import { wait } from "$lib/utils.ts";


export const actions = {
  vote: (async ({platform, url, locals}) => {

    const votingFor = url.searchParams.get("for");
    if(!votingFor) return fail(400, {message: "Missing thing to vote for!"});

    const k = url.searchParams.get("k");
    if(!k) return fail(400, {message: "Missing or invalid validator!"});

    const kn = Number(atob(k));
    if(Date.now() - kn > 15e3) {
      return fail(400, {message: "Missing or invalid validator!"});
    }

    await vote(locals.id, votingFor, platform?.env?.DB);

    // invalidate lateness voting cache
    latenessVotesCache.lastFetch = 0;

    // wait a few ms to ensure that the cache was invalidated
    await wait(10);

  })
} satisfies Actions;

async function vote(id: string, vote: string, db: D1Database) {
  await (db.prepare("insert into lateness_votes (id, timestamp, vote) values (?, ?, ?)")
    .bind(id, Date.now(), vote)
    .run());
}