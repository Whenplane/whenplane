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

  let collectionId: number | undefined = Number(params.handle);
  if(isNaN(collectionId)) {
    collectionId = await fetch(`/api/lttstore/${params.store}/collections/${params.handle}`)
      .then(r => r.ok ? r.json() : undefined)
      .then(r => r?.id as number | undefined);

    if(collectionId === undefined) throw error(404, 'Collection not found (this could also be an internal error)');
  }

  const store = storeIdFromName(params.store);

  const perPage = Number(url.searchParams.get("perPage") ?? 100);
  if(isNaN(perPage) || perPage > 100) throw error(400, "Invalid perPage! Must be a number <= 100");

  const cursor = url.searchParams.get("cursor");
  const decodedCursor = cursor && atob(cursor);
  if(cursor !== null && (!decodedCursor || !decodedCursor.includes("|"))) {
    throw error(400, "Invalid cursor!");
  }
  const [cursorTimestampStr, cursorRowStr] = decodedCursor?.split("|") ?? [undefined, undefined];
  const cursorTimestamp = Number(cursorTimestampStr);
  const cursorRow = Number(cursorRowStr);
  if(cursor !== null && (isNaN(cursorTimestamp) || isNaN(cursorRow))) {
    throw error(400, "Invalid cursor!");
  }


  const results = await retryD1(() =>
    (cursor == null)
      ? db
        .prepare("select * from collection_changes where store = ? and id = ? order by timestamp desc, change_id desc limit ?")
        .bind(
          store,
          collectionId,
          perPage + 1, // pre-fetch 1 extra to see if there is more than the current page
        )
        .all<ChangeHistoryTableRow & {change_id: number}>()
        .then(r => r.results)
      : db
        .prepare("select * from collection_changes where store = ? and id = ? and (timestamp, change_id) < (?, ?) order by timestamp desc, change_id desc limit ?")
        .bind(
          store,
          collectionId,
          cursorTimestamp,
          cursorRow,
          perPage + 1, // pre-fetch 1 extra to see if there is more than the current page
        )
        .all<ChangeHistoryTableRow & {change_id: number}>()
        .then(r => r.results)
  );

  const hasNextPage = results.length > perPage;
  const nextCursor = hasNextPage
    ? btoa(`${results[perPage - 1].timestamp}|${results[perPage - 1].change_id}`)
      .replaceAll("=", "")
    : undefined;
  const changeHistory = (hasNextPage ? results.slice(0, perPage) : results)
    .map(r => ({...r, change_id: undefined}));


  return json({
    changeHistory,
    page: {
      perPage,
      hasNextPage,
      cursor: nextCursor,
      hint: url.searchParams.has("cursor") || url.searchParams.has("perPage") || !hasNextPage
        ? undefined
        : `Add ?cursor=${encodeURIComponent(nextCursor!)} to the url to get the next page. ` +
        `Then keep using the returned cursor to get the next page until hasNextPage is false ` +
        `(where cursor would also be undefined)`
    }
  });
}) satisfies RequestHandler