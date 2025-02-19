import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { NewsPost } from "$lib/news/news.ts";
import { truncateText } from "$lib/utils.ts";
import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import { vote_valid_for } from "$lib/voting.ts";
import { env } from "$env/dynamic/private";

let lastSessionCheck = 0;

export const GET = (async ({platform}) => {

  const db: D1Database = platform?.env?.DB;

  if(!db) throw error(503, "Database missing");

  if(Date.now() - lastSessionCheck > 60 * 60e3) {
    platform?.context?.waitUntil(checkForSessions(platform));
    lastSessionCheck = Date.now()
  }

  async function tryDB(attempt = 1): Promise<NewsPost>  {
    if(!db) throw error(503, "Database unavailable!");
    return await db.prepare("select * from news where timestamp <= ? order by timestamp DESC limit 1")
      .bind(Date.now() + (60 * 60e3))
      .all<NewsPost>()
      .then(r => r.results[0] as unknown as NewsPost)
      .then(n => {return {...n, body: truncateText(n.body, 500)}})
      .catch(e => {
        console.warn("Attempt number " + attempt + " failed." + (attempt < 3 ? " Retrying." : ""));
        if(attempt < 3) {
          return tryDB(++attempt);
        } else {
          throw e;
        }
      })
  }

  return json(await tryDB());
}) satisfies RequestHandler;


async function checkForSessions(platform: App.Platform) {
  function celebrate(name: string) {
    if (env.ERROR_REPORTING_WEBHOOK) {
      try {
        platform?.context?.waitUntil(
          fetch(
            env.ERROR_REPORTING_WEBHOOK as string,
            {
              method: "POST",
              body: JSON.stringify({
                content: "<@171160105155297282> We have sessions! on " + name
              })
            }
          )
        )
      } catch (e) {
        console.error("Error while trying to celebrate!", e);
      }
    }
  }

  const D1DBs = Object.entries({
    DB: platform?.env?.DB,
    LTTSTORE_DB: platform?.env?.LTTSTORE_DB,
    MERCHMESSAGES_DB: platform?.env?.MERCHMESSAGES_DB,
    FP_SUBS_DB: platform?.env?.FP_SUBS_DB,
    AUTH: platform?.env?.AUTH,
    TOPICS: platform?.env?.TOPICS
  }).filter(d => typeof d[1] !== "undefined");

  const hasSessions = [];
  for (const [name, db] of D1DBs) {
    if(typeof (db as any).withSession === "function") hasSessions.push(name)
  }

  if(hasSessions.length > 0) celebrate(hasSessions.join(", "))

}