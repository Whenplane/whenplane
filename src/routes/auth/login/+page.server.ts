import { type Actions, fail } from "@sveltejs/kit";
import * as bcrypt from "bcryptjs";
import { sendEmail, VERIFICATION_EMAIL } from "$lib/server/email.ts";
import { escapeHtml } from "$lib/utils.ts";
import { EMAIL_ENDPOINT, EMAIL_PASSWORD, EMAIL_PORT, EMAIL_PROXY_KEY, EMAIL_SERVER, EMAIL_USERNAME } from "$env/static/private";
import { log } from "$lib/server/server-utils";

const simpleRateLimit: {[ip: string]: number[]} = {};

export const actions = {
  login: (async ({platform, request, getClientAddress}) => {
    const data = await request.formData();
    const username = data.get("username") as string;
    const password = data.get("password") as string;

    if(!username || !password) {
      return fail(400, {username, missing: true})
    }

    let limits = simpleRateLimit[getClientAddress()] ?? [];
    // remove any requests older than 60 seconds (which will probably never happen but better to be safe)
    limits = limits.filter(t => t > (Date.now() - 60e3));

    if(limits.length > 3) {
      return fail(429, {username, ratelimited: true})
    }
    limits.push(Date.now());
    simpleRateLimit[getClientAddress()] = limits;

    const db = platform?.env?.AUTH;
    if(!db) return fail(500, {username, message: "Missing auth db!"});

    const kv = platform?.env?.AUTH_KV;
    if(!kv) return fail(500, {username, message: "Missing auth kv!"});

    const user = await db.prepare("select username,password as hashedPassword,'2fa',email_verified,email from users where username = ?")
      .bind(username).first<{username: string, hashedPassword: string, "2fa": string, email_verified: boolean, email: string}>();

    if(!user) {
      return fail(400, {username, incorrect: true});
    }

    if(!await bcrypt.compare(password, user.hashedPassword)) {
      return fail(400, {username, incorrect: true});
    }


    if(!user.email_verified) {

      // generate a token that allows re-sending the verification email
      let resendToken: string | undefined = undefined;

      if(!(await kv.get("block-email:" + user.username))) {
        resendToken = randomString();

        await kv.put("email-resend:" + resendToken, JSON.stringify({
          email: user.email,
          username: user.username
        }), {expirationTtl: 5 * 60e3})
      }

      return fail(400, {username, emailVerificationNeeded: true, resendToken});
    }


    return fail(500, {message: "TODO: success"});
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

    await kv.put("email:" + emailVerifyToken, username, {expirationTtl: 20 * 60e3});

    // prevents re-sending of the email before the previous one has expired
    await kv.put("block-email:" + username, email, {expirationTtl: 19 * 60e3});

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