import type { D1Database } from "@cloudflare/workers-types";
import type { Actions } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";


export const actions = {
  vote: (async ({platform, url, locals}) => {

    const votingFor = url.searchParams.get("for");
    if(!votingFor) return fail(400, {message: "Missing thing to vote for!"});

    return await vote(locals.id, votingFor, platform?.env?.DB);

  })
} satisfies Actions;

async function vote(id: string, vote: string, db: D1Database) {
  await (db.prepare("insert into lateness_votes (id, timestamp, vote) values (?, ?, ?)")
    .bind(id, Date.now(), vote)
    .run());
}