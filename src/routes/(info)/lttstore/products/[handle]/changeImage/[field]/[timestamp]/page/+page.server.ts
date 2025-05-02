import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils.ts";

export const load = (async ({params, platform, url}) => {
  const productId = Number(params.handle ?? "NaN");
  const field = params.field;
  const timestamp = Number(params.timestamp ?? "NaN");

  if(isNaN(timestamp) || isNaN(productId)) throw error(400);

  const bookmark = url.searchParams.get("bookmark");

  const db = platform?.env?.LTTSTORE_DB.withSession(bookmark ?? "first-primary");
  if(!db) throw error(503, "Missing db!");

  const change = await retryD1(() =>
    db.prepare("select * from change_history where id = ? and timestamp = ? and field = ?")
      .bind(productId, timestamp, field)
      .first<{id: number, timestamp: number, field: string, old: string, new: string}>()
  );

  if(!change) throw error(404);

  return {
    change,
  }


}) satisfies PageServerLoad