import type { D1Database, D1DatabaseSession } from "@cloudflare/workers-types";
import type { Actions } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";
import { latenessVotesCache } from "$lib/stores.ts";
import { wait } from "$lib/utils.ts";
import { n } from "$lib/timeUtils.ts";
import { dev } from "$app/environment";


export const actions = {
  vote: (async ({platform, url, locals, cookies}) => {

    const votingFor = url.searchParams.get("for");
    if(!votingFor) return fail(400, {message: "Missing thing to vote for!"});

    const k = url.searchParams.get("k");
    if(!k) return;

    const kn = Number(atob(k));
    if(n() - kn > 14390) {
      return;
    }

    const session = platform?.env?.DB.withSession()
    if(!session) return fail(500, {message: "Missing DB!"})

    await vote(locals.id, votingFor, session);


    const bookmark = session?.getBookmark();
    if(bookmark) {
      cookies.set("voteConsistencySession", bookmark, {
        path: "/",
        // 5 minutes is MORE than enough time for the db write to be replicated
        // (according to the blog post, its usually under 100ms)
        expires: new Date(Date.now() + (5 * 60e3)),
        secure: dev ? false : undefined
      })
    }

    // invalidate lateness voting cache
    latenessVotesCache.lastFetch = 0;

    // wait a few ms to ensure that the cache was invalidated
    await wait(10);

  })
} satisfies Actions;

async function vote(id: string, vote: string, db: D1Database | D1DatabaseSession) {
  await (db.prepare("insert into lateness_votes (id, timestamp, vote) values (?, ?, ?)")
    .bind(id, Date.now(), vote)
    .run());
}