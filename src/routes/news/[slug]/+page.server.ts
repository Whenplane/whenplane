import type {PageServerLoad} from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { error } from "@sveltejs/kit";

export const load = (async ({platform, params}) => {

  const db: D1Database = platform?.env?.DB;
  if(!db) throw error(503, "Database missing");

  const post = await db.prepare("select * from news where url=?")
    .bind(params.slug)
    .first()

  if(post == null) {
    throw error(404, "Post not found")
  }

  return {post}
}) satisfies PageServerLoad;