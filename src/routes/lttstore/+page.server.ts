import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { D1Database } from "@cloudflare/workers-types";
import { dev } from "$app/environment";


export const load = (async ({platform}) => {
  const db: D1Database | undefined = platform?.env?.LTTSTORE_DB;
  if(!db) throw error(503, "DB unavailable!");

  if(dev) {
    await db.prepare("create table if not exists products (handle text, id integer PRIMARY KEY, title text, product text, stock string, purchasesPerHour integer, regularPrice integer, currentPrice integer, firstSeen integer, available integer)")
      .run();
  }

  const popularProducts = await db.prepare("select * from products order by purchasesPerHour DESC limit 10")
    .all()
    .then(r => r.results);

  return {
    popularProducts
  }
}) satisfies PageServerLoad
