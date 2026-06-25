import { error } from "@sveltejs/kit";
import { retryD1 } from "$lib/utils.ts";
import type { MMShow, MMV2CondensedTableRow, MMV2TableRow } from "$lib/merch-messages/mm-types.ts";
import type { PageServerLoad } from "./$types";

export const load = (async ({platform, params, parent}) => {
  const data = await parent();

  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const show = await retryD1(() =>
    db.prepare("select * from shows where showId=?")
      .bind(data.name)
      .first<MMShow>()
  );

  if(show === null) {
    throw error(404, "Merch Messages not found (or not processed yet)")
  }

  const types = {message: 0, reply: 1};
  const positions = {TOP: 0, BOTTOM: 1}

  const messages = (await retryD1(() =>
    db.prepare("select floor(timestamp) as timestamp,type,name,text,jobId from merch_messages_v2 where show = ? order by timestamp ASC")
      .bind(data.name)
      .all<MMV2TableRow>()
      .then(r => r.results)
  ))
    .map(m => ({
      t: m.timestamp,
      ...m,
      timestamp: undefined,
      jobId: undefined,
      job: (show.status === "inprogress" && m.jobId && m.jobId.split("_")[0]?.substring(2)) || undefined,
      type: types[m.type] ?? m.type,
      position: undefined,
      pos: positions[m.position] ?? m.position
    } as unknown as MMV2CondensedTableRow));

  return { mmShow: show, messages}

}) satisfies PageServerLoad;