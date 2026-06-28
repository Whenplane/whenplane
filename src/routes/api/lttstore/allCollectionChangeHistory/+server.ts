import { error, json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import type {RequestHandler} from "./$types";
import { createTables } from "../../../(info)/lttstore/createTables.ts";
import type { ChangeHistoryTableRow } from "$lib/lttstore/lttstore_types.ts";
import { retryD1 } from "$lib/utils.ts";


export const GET = (async ({platform, url}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  if(dev) await createTables(db);

  const perPage = Number(url.searchParams.get("perPage") ?? 100);
  if(isNaN(perPage) || perPage > 500) throw error(400, "Invalid perPage! Must be a number <= 500");

  const offset = Number(url.searchParams.get("offset") ?? 0);
  if(isNaN(offset)) throw error(400, "Invalid offset! Must be a number");

  const results = await retryD1(() =>
    db
      .prepare("select * from collection_changes order by timestamp desc limit ? offset ?")
      .bind(
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