import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils.ts";

export const load = (async ({fetch, platform}) => {

  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const shows = await retryD1(() =>
    db.prepare("select * from shows order by releaseDate DESC")
      .all<{showId: string, status: string, title: string, releaseDate: number, messageCount: string}>()
  );

  return {shows}

}) satisfies PageServerLoad