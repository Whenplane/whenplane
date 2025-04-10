import type {PageServerLoad} from "./$types";
import { error } from "@sveltejs/kit";

export const load = (async ({platform, params}) => {

  const db = platform?.env?.DB?.withSession();
  if(!db) throw error(503, "Database missing");

  const post = await db.prepare("select * from news where url=?")
    .bind(params.slug)
    .first()

  if(post == null) {
    throw error(404, "Post not found")
  }

  return {post}
}) satisfies PageServerLoad;