import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { createTables } from "../../../../../../(info)/lttstore/createTables.ts";
import type {RequestHandler} from "./$types";
import { type ChangeHistoryTableRow, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";


export const GET = (async ({fetch, params, platform, url}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const brief: {id: number, handle: string, title: string} | undefined = await fetch(`/api/lttstore/${params.store}/products/brief/${params.handle}`)
    .then(r => r.ok ? r.json() : undefined);

  if(!brief) throw error(404, 'Product not found (this could also be an internal error)');

  const store = storeIdFromName(params.store);

  const perPage = Number(url.searchParams.get("perPage") ?? 100);
  if(isNaN(perPage) || perPage > 100) throw error(400, "Invalid perPage! Must be a number <= 100");

  const offset = Number(url.searchParams.get("offset") ?? 0);
  if(isNaN(offset)) throw error(400, "Invalid offset! Must be a number");

  const results = await retryD1(() =>
    db
      .prepare("select * from change_history where store = ? and id = ? order by timestamp desc limit ? offset ?")
      .bind(
        store,
        brief.id,
        perPage + 1, // pre-fetch 1 extra to see if there is more than the current page
        offset
      )
      .all<ChangeHistoryTableRow>()
      .then(r => r.results)
  );

  const hasNextPage = results.length > perPage;
  const changeHistory = hasNextPage ? results.slice(0, perPage) : results;

  const nextOffset = hasNextPage ? offset + perPage : undefined;

  return json({
    changeHistory,
    page: {
      perPage,
      hasNextPage,
      nextOffset,
      hint: url.searchParams.has("offset") || url.searchParams.has("perPage") || !hasNextPage
        ? undefined
        : `Add ?offset=${nextOffset} to the url to get the next page. ` +
        `Then keep using nextOffset to get the next page until hasNextPage is false ` +
        `(where nextOffset would also be undefined)`
    }
  });
}) satisfies RequestHandler