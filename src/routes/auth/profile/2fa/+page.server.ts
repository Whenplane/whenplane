import type {Actions} from "./$types";
import type {PageServerLoad} from "./$types";
import { error, fail, redirect } from "@sveltejs/kit";
import * as OTPAuth from "otpauth";
import type { KVNamespace } from "@cloudflare/workers-types";
import { generateRandomBase32, getSession, getTotp, validate2fa } from "$lib/server/auth.ts";

export const load = (async ({platform, request, cookies}) => {

  const db = platform?.env?.AUTH;
  if(!db) throw error(503, "Missing auth db!");

  const session = await getSession(platform, cookies.get("session"));
  if(!session) throw redirect(302, "/auth/login");

  const has2fa = await db.prepare("select `2fa` from users where username=?")
    .bind(session.username)
    .first<{"2fa": string | null}>()
    .then(r => !!r?.["2fa"]);
  if(has2fa) return {has2fa};

  const cache = platform?.env?.CACHE as KVNamespace;
  if(!cache) throw error(503, "Cache not available!");

  let twoFactorURI;
  let id;

  let expiration;

  const isPost = request.method == "POST";

  // Preserve totp token between verification attempts
  if(isPost) {
    const data = await request.formData();
    id = data.get("id") as string;

    if(id) {
      const existingData = await cache.getWithMetadata<{expiration?: number}>("whenplane:temp_id:" + id);

      expiration = existingData.metadata?.expiration ?? Number.MAX_VALUE;

      // Only preserve if it still exists, and is not about to expire
      if(existingData.value && ((Date.now()/1000) - expiration) > 5) {
        twoFactorURI = existingData.value;
      }
    }
  }

  if(!isPost || !twoFactorURI) {
    expiration = (Date.now() / 1000) + (60 * 2)
    twoFactorURI = getTotp(generateRandomBase32()).toString()
    id = crypto.randomUUID();
    await cache.put("whenplane:temp_id:" + id, twoFactorURI, {expiration});
  }

  return {
    has2fa,
    twoFactorURI,
    id,
    expiration
  }

}) satisfies PageServerLoad

export const actions = ({
  enroll: async ({platform, request, cookies}) => {

    const data = await request.formData();

    const id = data.get("id") as string;
    const code = data.get("confirmation-code") as string;

    if(!id) return fail(400, {message: "Missing ID!"});
    if(!code) return fail(400, {message: "Missing confirmation code!"});


    const db = platform?.env?.AUTH;
    if(!db) throw error(503, "Missing auth db!");

    const session = await getSession(platform, cookies.get("session"));
    if(!session) throw redirect(302, "/auth/login?reauth");

    const cache = platform?.env?.CACHE as KVNamespace;
    if(!cache) return fail(503, {message: "Missing cache!"});

    const URI = await cache.get("whenplane:temp_id:" + id);

    if(!URI) return fail(400, {message: "Invalid ID! It might have expired. Reload the page and try again."});

    const totp = OTPAuth.URI.parse(URI);

    if(totp.validate({token: code, window: 1}) == null) {
      return fail(400, {message: "The code you entered was invalid. Please try again."})
    }

    console.log("Adding 2fa with type", (typeof totp.secret.base32), "to", session.username)

    await db.prepare("update users set `2fa`=? WHERE username=?")
      .bind(totp.secret.base32, session.username)
      .run()

    const secret = await db.prepare("select `2fa` from users where username=?")
      .bind(session.username)
      .first<{"2fa": string | null}>()
    console.log("Now has 2fa:", secret)

    return {success: true}
  },
  unenroll: async ({platform, request, cookies}) => {

    const data = await request.formData();

    const code = data.get("confirmation-code") as string;
    if(!code) return fail(400, {message: "Missing confirmation code!"});

    const db = platform?.env?.AUTH;
    if(!db) throw error(503, "Missing auth db!");

    const session = await getSession(platform, cookies.get("session"));
    if(!session) throw redirect(302, "/auth/login?reauth");


    console.log("un-enrolling user");

    const secret = await db.prepare("select `2fa` from users where username=?")
      .bind(session.username)
      .first<string>("2fa")
    if(!secret) return fail(400, {message: "You do not have 2fa, so you cannot be un-enrolled!"});

    console.log("secret fetched")

    if(!validate2fa(secret, code)) return fail(400, {message: "Invalid code! Please try again"});

    console.log("code is valid");

    await db.prepare("update users set `2fa`=NULL WHERE username=?")
      .bind(session.username)
      .run();

    return {success: true}
  }
}) satisfies Actions