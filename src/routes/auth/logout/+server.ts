import { error, redirect, type RequestHandler } from "@sveltejs/kit";
import { getSession } from "$lib/server/auth.ts";
import { dev } from "$app/environment";


export const GET = (async ({platform, cookies}) => {

  const db = platform?.env?.AUTH;
  if(!db) throw error(503, "Missing auth db!");

  const session = await getSession(platform, cookies.get("session"));

  if(!session) {
    console.log("Logout request does not have a session! Not doing anything.")
    throw redirect(302, "/auth");
  }

  await db.prepare("delete from sessions where sessionID=?")
    .bind(session.sessionID)
    .run();

  const secure = dev ? false : undefined;
  cookies.delete("session", {path: '/', secure});

  throw redirect(302, "/auth");
}) satisfies RequestHandler