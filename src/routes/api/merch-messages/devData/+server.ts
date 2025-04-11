import { error, json, type RequestHandler } from "@sveltejs/kit";


export const GET = (async ({platform}) => {
  const db = platform?.env?.MERCHMESSAGES_DB.withSession();
  if(!db) throw error(503, "DB unavailable!");

  const videos = await db.prepare("select * from videos order by releaseDate desc")
    .all()
    .then(r => r.results);

  const latest5 = videos.slice(0, 5).map(v => v.videoId);

  const merchMessages = await db.prepare("select * from merch_messages where video = ? or video = ? or video = ? or video = ? or video = ?")
    .bind(...latest5)
    .all()
    .then(r => r.results);

  return json({videos, merchMessages})

}) satisfies RequestHandler