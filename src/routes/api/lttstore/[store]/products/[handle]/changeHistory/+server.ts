import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { createTables } from "../../../../../../(info)/lttstore/createTables.ts";
import type {RequestHandler} from "./$types";
import { storeIdFromName } from "$lib/lttstore/lttstore_types.ts";

const PAGE_SIZE = 100;

export const GET = (async ({fetch, params, platform, url}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const brief: {id: number, handle: string, title: string} | undefined = await fetch(`/api/lttstore/${params.store}/products/brief/${params.handle}`)
    .then(r => r.ok ? r.json() : undefined);

  if(!brief) throw error(404, 'Product not found (this could also be an internal error)');

  const store = storeIdFromName(params.store);

  const offset = Number(url.searchParams.get("offset") ?? 0);
  if(isNaN(offset)) throw error(400, "Invalid offset! Must be a number");

  const results = await db
    .prepare("select * from change_history where store = ? and id = ? order by timestamp desc limit ? offset ?")
    .bind(
      store,
      brief.id,
      PAGE_SIZE + 1, // pre-fetch 1 extra to see if there is more than the current page
      offset
    )
    .all<{id: number, timestamp: number, field: string, old: string, new: string}>()
    .then(r => r.results)

  const hasNextPage = results.length > PAGE_SIZE;
  const changeHistory = hasNextPage ? results.slice(0, PAGE_SIZE) : results;

  const nextOffset = hasNextPage ? offset + PAGE_SIZE : undefined;

  return json({
    changeHistory,
    page: {
      perPage: PAGE_SIZE,
      hasNextPage,
      nextOffset,
      hint: url.searchParams.has("offset") && hasNextPage
        ? undefined
        : `Add ?offset=${nextOffset} to the url to get the next page. ` +
        `Then keep using nextOffset to get the next page until hasNextPage is false ` +
        `(where nextOffset would also be undefined)`
    }
  });
}) satisfies RequestHandler