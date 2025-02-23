import { type Actions, fail, redirect } from "@sveltejs/kit";
import * as bcrypt from "bcryptjs";
import { sendEmail, VERIFICATION_EMAIL } from "$lib/server/email.ts";
import { escapeHtml } from "$lib/utils.ts";
import { EMAIL_ENDPOINT, EMAIL_PASSWORD, EMAIL_PORT, EMAIL_PROXY_KEY, EMAIL_SERVER, EMAIL_USERNAME } from "$env/static/private";
import { log } from "$lib/server/server-utils";
import { dev } from "$app/environment";
import { createTables, getSession } from "$lib/server/auth.ts";
import type {PageServerLoad} from "./$types"

const simpleRateLimit: {[ip: string]: number[]} = {};

let first = true;

export const load = (async ({platform, cookies}) => {

  const sessionID = cookies.get("session");
  if(!sessionID) return;

  const sessionData = await getSession(platform, sessionID);
  if(!sessionData) {
    const verifyingSessionData = await getSession(platform, sessionID+":verifying", undefined, undefined, true);

    if(!verifyingSessionData) {
      return;
    } else {
      // user has a 2fa verifying session, redirect to 2fa page
      throw redirect(302, "/auth/login/2fa")
    }
  }

  throw redirect(302, "/auth");
}) satisfies PageServerLoad

export const actions = {
  login: (async ({platform, request, getClientAddress, cookies}) => {
    const data = await request.formData();
    const username = data.get("username") as string;
    const password = data.get("password") as string;

    if(!username || !password) {
      return fail(400, {username, missing: true})
    }
    if(username.length > 16 || password.length > 128) {
      return fail(400, {username, message: "Too long!"})
    }

    // basic checks passed, start rate limiting

    let limits = simpleRateLimit[getClientAddress()] ?? [];
    // remove any requests older than 60 seconds (which will probably never happen but better to be safe)
    limits = limits.filter(t => t > (Date.now() - 60e3));

    if(limits.length > 3) {
      return fail(429, {username, ratelimited: true})
    }
    limits.push(Date.now());
    simpleRateLimit[getClientAddress()] = limits;

    // rate limiting passed

    const db = platform?.env?.AUTH;
    if(!db) return fail(500, {username, message: "Missing auth db!"});

    const kv = platform?.env?.AUTH_KV;
    if(!kv) return fail(500, {username, message: "Missing auth kv!"});

    if(first) {
      first = false;
      await createTables(db);
    }

    const user = await db.prepare("select username,password as hashedPassword,`2fa`,email_verified,email from users where username = ?")
      .bind(username).first<{username: string, hashedPassword: string, "2fa": string, email_verified: boolean, email: string}>();

    if(!user) {
      return fail(400, {username, incorrect: true});
    }

    if(!await bcrypt.compare(password, user.hashedPassword)) {
      return fail(400, {username, incorrect: true});
    }


    // username and password are valid!


    if(!user.email_verified) { // dont allow logging in if email isn't verified yet

      // generate a token that allows re-sending the verification email
      let resendToken: string | undefined = undefined;

      if(!(await kv.get("block-email:" + user.username))) {
        resendToken = randomString();

        await kv.put("email-resend:" + resendToken, JSON.stringify({
          email: user.email,
          username: user.username
        }), {expirationTtl: 5 * 60})
      }

      return fail(400, {username, emailVerificationNeeded: true, resendToken});
    }

    // email is verified!


    let newSessionID: string;
    do {
      newSessionID = Date.now().toString(36) + "-" + crypto.randomUUID();
    } while(
      ![null, undefined, user.username].includes(
        await db.prepare("select username from sessions where sessionID=?")
          .bind(newSessionID)
          .first<{username: string}>()
          .then(r => r?.username)
      )
      )

    const expires = new Date(Date.now() + (user["2fa"] ? (30 * 60e3) : (30 * 24 * 60 * 60e3))); // 30 minutes for 2fa, 30 days for without

    await db.prepare("insert into sessions (sessionID, username, expires) values (?, ?, ?)")
      .bind(newSessionID + (user["2fa"] ? ":verifying" : ""), user.username, expires.getTime()).run();

    const secure = dev ? false : undefined;
    cookies.set("session", newSessionID, {path: '/', expires: expires, secure});

    throw redirect(302, (user["2fa"] ? "/auth/login/2fa" : "/auth"));
  }),






  resendVerification: (async ({platform, url}) => {

    const db = platform?.env?.AUTH;
    if(!db) return fail(500, {message: "Missing auth db!"});

    const kv = platform?.env?.AUTH_KV;
    if(!kv) return fail(500, {message: "Missing auth kv!"});


    const resendToken = url.searchParams.get("resendToken");

    if(!resendToken) {
      return fail(400, {message: "Missing resend token!"});
    }

    const tokenData = await kv.get<{email: string, username: string}>("email-resend:" + resendToken, {type: 'json'});

    if(!tokenData) {
      return fail(400, {message: "Invalid or expired resend token! Reloading the page, then try again."});
    }

    const {email, username} = tokenData;


    const emailVerifyToken = randomString();

    await kv.put("email:" + emailVerifyToken, username, {expirationTtl: 20 * 60});

    // prevents re-sending of the email before the previous one has expired
    await kv.put("block-email:" + username, email, {expirationTtl: 19 * 60});

    log(platform, "Sending verification email to " + email);
    await sendEmail(EMAIL_ENDPOINT, {
      key: EMAIL_PROXY_KEY,

      host: EMAIL_SERVER,
      port: Number(EMAIL_PORT),

      username: EMAIL_USERNAME,
      password: EMAIL_PASSWORD,

      from: "Whenplane <bread@whenplane.com>",
      to: email,
      subject: "Verify your email for your Whenplane account",
      body: VERIFICATION_EMAIL
        .replaceAll("{VERIFICATION_LINK}", "https://whenplane.com/auth/verify-email?token=" + encodeURIComponent(emailVerifyToken))
        .replaceAll("{USERNAME}", escapeHtml(username))
    });

    await kv.delete("email-resend:" + resendToken);

    return {emailResent: true};
  })
} satisfies Actions;

function randomString() {
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Date.now().toString(36) + btoa(array).replaceAll("=", "");
}