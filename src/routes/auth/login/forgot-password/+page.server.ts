import { fail } from "@sveltejs/kit";
import { escapeHtml, wait } from "$lib/utils.ts";
import { PASSWORD_RESET_EMAIL, sendEmail } from "$lib/server/email.ts";
import { EMAIL_ENDPOINT, EMAIL_PORT, EMAIL_PROXY_KEY, EMAIL_SERVER, EMAIL_USERNAME, EMAIL_PASSWORD } from "$env/static/private";
import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { env } from "$env/dynamic/private";

const simpleRateLimit: {[ip: string]: number[]} = {}

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


export const actions = {
  default: async ({ platform, request, getClientAddress }) => {
    const data = await request.formData();
    const email = (data.get("email") as string)?.toLowerCase();

    if(!email) {
      return fail(400, {invalidEmail: true})
    }

    if(email.length > 128) {
      return fail(400, {email, emailLength: true})
    }

    let limits = simpleRateLimit[getClientAddress()] ?? [];
    // remove any requests older than 5 minutes (which will probably never happen but better to be safe)
    limits = limits.filter(t => t > (Date.now() - (5 * 60e3)));

    if(limits.length > 3) {
      return fail(429, {email, ratelimited: true})
    }
    limits.push(Date.now());
    simpleRateLimit[getClientAddress()] = limits;

    const token = data.get("cf-turnstile-response");
    if(!token) return fail(400, {email, message: "Invalid turnstile response!"})
    const ip = request.headers.get('CF-Connecting-IP') || getClientAddress();
    if(!env.TURNSTILE_SECRET) return fail(503, {message: "Invalid turnstile secret!"})

    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const turnstileResponse: {success: boolean, "error-codes"?: string[]} = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData
      }
    ).then(r => r.json());

    console.debug({turnstileResponse})

    if(!turnstileResponse.success) {
      return fail(400, {email, message: "Failed turnstile! Errors: " + turnstileResponse["error-codes"]});
    }

    if(!emailRegex.test(email)) {
      return fail(400, {email, invalidEmail: true})
    }

    const db: D1Database | undefined = platform?.env?.AUTH;
    if(!db) return fail(500, {message: "Missing auth db!"});

    const kv: KVNamespace | undefined = platform?.env?.AUTH_KV;
    if(!kv) return fail(500, {message: "Missing auth kv!"});

    const username = await db.prepare("select username from users where email = ?")
      .bind(email)
      .first<string>("username");


    if(username == null || await kv.get("block-password-reset:" + email) !== null) {
      console.log("Email without an account was entered. delaying response.")
      // wait a random delay (50-800ms) to prevent ppl using the response delay to figure out if an account exists or not
      await wait(50 + (Math.random() * 750));

      return {email, success: true};
    }

    const resetToken = randomString();
    const tokenExpiration = Date.now() + (20 * 60e3);
    await kv.put("password-reset:" + resetToken, email, {expiration: tokenExpiration/1e3});

    platform?.context?.waitUntil(
      sendEmail(EMAIL_ENDPOINT, {
        key: EMAIL_PROXY_KEY,

        host: EMAIL_SERVER,
        port: Number(EMAIL_PORT),

        username: EMAIL_USERNAME,
        password: EMAIL_PASSWORD,

        from: "Whenplane <bread@whenplane.com>",
        to: email,
        subject: "Reset your password for your Whenplane account",
        body: PASSWORD_RESET_EMAIL
          .replaceAll("{RESET_LINK}", "https://whenplane.com/auth/reset-password?token=" + encodeURIComponent(resetToken) + "&expiration=" + tokenExpiration)
          .replaceAll("{USERNAME}", escapeHtml(username))
      })
    )

    await kv.put("block-password-reset:" + email, "yes", {expirationTtl: 19 * 60});

    console.log("started password reset progress");
    return {email, success: true};
  }
}

function randomString() {
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Date.now().toString(36) + btoa(array).replaceAll("=", "");
}