import { error } from "@sveltejs/kit";
import { type CollectionDbRow, storeIdFromName } from "$lib/lttstore/lttstore_types.ts";
import type {PageServerLoad} from "./$types";
import { retry, retryD1 } from "$lib/utils.ts";

export const load = (async ({platform, params, fetch}) => {
  const db = platform?.env?.LTTSTORE_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const store = storeIdFromName(params.store);

  const collection = await retryD1(() =>
    db.prepare("select * from collections where handle = ? and store = ?")
      .bind(params.handle, store)
      .first<CollectionDbRow>()
  )

  if(collection === null) return error(404, "Collection not found");

  const initialChangeHistory = (async () => {
    const textEncoder = new TextEncoder();
    let perPage = 30;
    let response;
    do {
      response = await retry(() =>
        fetch(`/api/lttstore/${params.store}/collections/${collection.id}/changeHistory?offset=0&perPage=${perPage}`)
          .then(r => r.json())
      );
      perPage--;
    } while(textEncoder.encode(JSON.stringify(response)).length > 1_000_000);
    // dynamic number of changeHistory entries in initial reply, to make sure we stay below 2mb google page limit
    // (streamed data counts towards the size limit)
    return response;
  })();

  const shortTitles = Object.fromEntries(
    (await retryD1(() =>
      db.prepare("select id,shortTitle from products where store = ? and id in (SELECT value FROM json_each(?)) and shortTitle is not null")
        .bind(
          store,
          JSON.stringify(
            JSON.parse(collection.products)
              .map((p: {id: number}) => p.id)
          )
        )
        .all<{id: number, shortTitle: string | null}>()
        .then(r => r.results)
    ))
      .map(r => [r.id, r.shortTitle])
  );

  return {
    shortTitles,
    collection,
    initialChangeHistory
  }

}) satisfies PageServerLoad