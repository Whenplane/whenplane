import type {PageServerLoad} from "./$types"
import { error, fail, redirect } from "@sveltejs/kit";
import { getSession, validate2fa } from "$lib/server/auth.ts";
import type { Actions } from "./$types";
import { dev } from "$app/environment";

export const load = (async ({platform, cookies}) => {

  const db = platform?.env?.AUTH;
  if(!db) throw error(503, "Missing auth db!");


  const sessionID = cookies.get("session");
  if(!sessionID) throw redirect(302, "/auth/login");

  if(!await getSession(platform, sessionID+":verifying")) {
    throw redirect(302, "/auth/login");
  }
}) satisfies PageServerLoad

const simpleRateLimit: {[ip: string]: number[]} = {};

export const actions = {
  default: async ({platform, cookies, request, getClientAddress}) => {

    const data = await request.formData();
    const token = data.get("token") as string | null;

    if(!token) return fail(400, {missing: true});

    // basic checks passed, start rate limiting

    let limits = simpleRateLimit[getClientAddress()] ?? [];
    // remove any requests older than 60 seconds (which will probably never happen but better to be safe)
    limits = limits.filter(t => t > (Date.now() - 60e3));

    if(limits.length > 3) {
      return fail(429, {ratelimited: true})
    }
    limits.push(Date.now());
    simpleRateLimit[getClientAddress()] = limits;

    // rate limiting passed

    const db = platform?.env?.AUTH;
    if(!db) throw fail(503, {message: "Missing auth db!"});

    const sessionID = cookies.get("session");
    if(!sessionID) throw redirect(303, "/auth/login");

    const session = await getSession(platform, sessionID+":verifying", undefined, true);
    if(!session) throw redirect(303, "/auth/login?reauth");

    const secret = session["2fa"];
    if(!secret) {
      console.warn("Missing 2fa secret!");
      throw redirect(303, "/auth/login?reauth");
    }

    if(!validate2fa(secret, token)) {
      return fail(401, {incorrect: true});
    }

    // 2fa is valid!

    const expires = new Date(Date.now() + (30 * 24 * 60 * 60e3));

    await db.prepare("insert into sessions (sessionID, username, expires) values (?, ?, ?)")
      .bind(sessionID, session.username, expires.getTime()).run();

    const secure = dev ? false : undefined;
    cookies.set("session", sessionID, {path: '/', expires: expires, secure});

    throw redirect(302, "/auth");
  }
} satisfies Actions;