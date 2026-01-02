import { error, json, type RequestHandler } from "@sveltejs/kit";


export const GET = (async ({platform}) => {
  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const shows = await db.prepare("select * from shows order by releaseDate desc")
    .all()
    .then(r => r.results);

  const latest5 = shows.slice(0, 5).map(v => v.showId);

  const showParams: string[] = [];
  latest5.forEach(() => showParams.push("show = ?"));

  const merchMessages = await db.prepare("select * from merch_messages_v2 where " + showParams.join(" or "))
    .bind(...latest5)
    .all()
    .then(r => r.results);

  return json({shows, merchMessages});

}) satisfies RequestHandler