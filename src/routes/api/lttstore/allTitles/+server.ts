import { error, json } from "@sveltejs/kit";
import type {RequestHandler} from "./$types";

export const GET = (async ({platform}) => {

  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const allProducts = await db.prepare("select title from products order by available DESC")
    .all<{title: string}>()
    .then(r => r.results
      .map(r => r.title))


  return json(allProducts)
}) satisfies RequestHandler